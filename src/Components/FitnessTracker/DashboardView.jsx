import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import fitnessService from '../../services/fitnessService';
import Notifications from './Notifications';
import AIAssistant from './AIAssistant';

const DashboardView = ({ user }) => {
  const [stats, setStats] = useState({
    caloriesConsumed: 0,
    caloriesGoal: 2200,
    workoutsThisWeek: 0,
    workoutsGoal: 5,
    waterIntake: 0,
    waterGoal: 8
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meals, setMeals] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const loadDashboardData = async () => {
      if (user && user.uid) {
        try {
          setError(null);
          setLoading(true);
          
          // Add timeout to prevent hanging
          const timeout = new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 10000);
          });
          
          // Load user profile to get goals
          const profilePromise = fitnessService.getUserProfile(user.uid);
          const profileResult = await Promise.race([profilePromise, timeout]);
          
          if (isMounted && profileResult.success) {
            const profileData = profileResult.data;
            setProfile(profileData);
            // Calculate calorie goal based on user profile
            const calorieGoal = calculateCalorieNeeds(profileData);
            
            if (isMounted) {
              setStats(prev => ({
                ...prev,
                caloriesGoal: calorieGoal
              }));
            }
          }
          
          // Load today's meals to calculate calories consumed
          const mealsPromise = fitnessService.getUserMeals(user.uid);
          const mealsResult = await Promise.race([mealsPromise, timeout]);
          
          if (isMounted && mealsResult) {
            setMeals(mealsResult);
            const today = new Date().toISOString().split('T')[0];
            const todayMeals = mealsResult.filter(meal => {
              // Check if meal has a loggedAt timestamp
              if (meal.loggedAt) {
                // Firebase timestamp might be a Firestore Timestamp object or a regular Date
                let mealDate;
                if (meal.loggedAt.toDate) {
                  // Firestore Timestamp
                  mealDate = meal.loggedAt.toDate();
                } else if (meal.loggedAt instanceof Date) {
                  // Regular Date object
                  mealDate = meal.loggedAt;
                } else {
                  // String or number timestamp
                  mealDate = new Date(meal.loggedAt);
                }
                return mealDate.toISOString().split('T')[0] === today;
              }
              // Fallback to date field if loggedAt is not available
              else if (meal.date) {
                return meal.date === today;
              }
              return false;
            });
            
            const caloriesConsumed = todayMeals.reduce((total, meal) => 
              total + (meal.calories || 0), 0
            );
            
            if (isMounted) {
              setStats(prev => ({
                ...prev,
                caloriesConsumed: caloriesConsumed
              }));
            }
          }
          
          // Load this week's workouts
          const workoutsPromise = fitnessService.getUserWorkouts(user.uid);
          const workoutsResult = await Promise.race([workoutsPromise, timeout]);
          
          if (isMounted && workoutsResult) {
            setWorkouts(workoutsResult);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const recentWorkouts = workoutsResult.filter(workout => {
              // Check if workout has a loggedAt timestamp (Firebase timestamp)
              if (workout.loggedAt) {
                // Firebase timestamp might be a Firestore Timestamp object or a regular Date
                let workoutDate;
                if (workout.loggedAt.toDate) {
                  // Firestore Timestamp
                  workoutDate = workout.loggedAt.toDate();
                } else if (workout.loggedAt instanceof Date) {
                  // Regular Date object
                  workoutDate = workout.loggedAt;
                } else {
                  // String or number timestamp
                  workoutDate = new Date(workout.loggedAt);
                }
                return workoutDate >= oneWeekAgo;
              }
              // Fallback to date field if loggedAt is not available
              else if (workout.date) {
                const workoutDate = new Date(workout.date);
                return workoutDate >= oneWeekAgo;
              }
              return false;
            });
            
            if (isMounted) {
              setStats(prev => ({
                ...prev,
                workoutsThisWeek: recentWorkouts.length
              }));
            }
          }
          
          // Load today's water intake
          const waterPromise = fitnessService.getWaterIntake(user.uid);
          const waterResult = await Promise.race([waterPromise, timeout]);
          
          if (isMounted && waterResult.success) {
            const today = new Date().toISOString().split('T')[0];
            if (waterResult.data.date === today) {
              setStats(prev => ({
                ...prev,
                waterIntake: waterResult.data.waterIntake
              }));
            } else {
              // If it's a different day, start with 0
              setStats(prev => ({
                ...prev,
                waterIntake: 0
              }));
            }
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          if (isMounted) {
            setError(error.message || 'Failed to load dashboard data');
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    };

    loadDashboardData();
    
    // Set up daily refresh at 12:00 AM
    const setupDailyRefresh = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0); // Set to next midnight (12:00 AM)
      
      const timeUntilMidnight = nextMidnight.getTime() - now.getTime();
      
      // Set timeout to refresh at midnight
      const refreshTimeout = setTimeout(() => {
        if (isMounted) {
          loadDashboardData(); // Refresh data at midnight
        }
        
        // Set up recurring daily refresh
        const dailyInterval = setInterval(() => {
          if (isMounted) {
            loadDashboardData(); // Refresh data every 24 hours
          }
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        
        // Clean up interval on component unmount
        return () => clearInterval(dailyInterval);
      }, timeUntilMidnight);
      
      return () => clearTimeout(refreshTimeout);
    };
    
    const cleanupDailyRefresh = setupDailyRefresh();
    
    // Listen for workout events to refresh dashboard
    const handleWorkoutEvent = () => {
      // Reload dashboard data when workouts are logged or deleted
      loadDashboardData();
    };

    window.addEventListener('workoutLogged', handleWorkoutEvent);
    window.addEventListener('workoutDeleted', handleWorkoutEvent);
    
    // Listen for meal events to refresh dashboard
    const handleMealEvent = () => {
      // Reload dashboard data when meals are logged or deleted
      loadDashboardData();
    };

    window.addEventListener('mealLogged', handleMealEvent);
    window.addEventListener('mealDeleted', handleMealEvent);
    
    // Cleanup function to prevent state updates after component unmount
    return () => {
      isMounted = false;
      cleanupDailyRefresh();
      window.removeEventListener('workoutLogged', handleWorkoutEvent);
      window.removeEventListener('workoutDeleted', handleWorkoutEvent);
      window.removeEventListener('mealLogged', handleMealEvent);
      window.removeEventListener('mealDeleted', handleMealEvent);
    };
  }, [user]);

  // Calculate daily calorie needs based on user profile
  const calculateCalorieNeeds = (profile) => {
    const { age, gender, height, currentWeight, activityLevel, goal } = profile;
    
    if (!age || !gender || !height || !currentWeight) return 2200;

    let bmr;
    if (gender === 'male') {
      // Mifflin-St Jeor Equation for men
      bmr = Math.round(10 * currentWeight + 6.25 * height - 5 * age + 5);
    } else {
      // Mifflin-St Jeor Equation for women
      bmr = Math.round(10 * currentWeight + 6.25 * height - 5 * age - 161);
    }

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
    
    // Adjust based on goal
    switch (goal) {
      case 'lose':
        return tdee - 500; // 500 calorie deficit for weight loss
      case 'gain':
        return tdee + 500; // 500 calorie surplus for muscle gain
      default:
        return tdee; // maintenance
    }
  };

  // Function to increase water intake
  const increaseWaterIntake = async () => {
    const newWaterIntake = stats.waterIntake + 1;
    setStats(prev => ({
      ...prev,
      waterIntake: newWaterIntake
    }));
    
    // Save to persistence
    if (user && user.uid) {
      try {
        const waterData = {
          waterIntake: newWaterIntake,
          date: new Date().toISOString().split('T')[0],
          userId: user.uid,
          timestamp: new Date().toISOString()
        };
        
        await fitnessService.saveWaterIntake(user.uid, waterData);
      } catch (error) {
        console.error('Error saving water intake:', error);
      }
    }
  };

  // Show a success message when a workout is logged
  useEffect(() => {
    const handleWorkoutLogged = () => {
      // You could show a toast notification or other UI feedback here
      console.log('Workout successfully logged! Dashboard updated.');
    };

    window.addEventListener('workoutLogged', handleWorkoutLogged);
    
    return () => {
      window.removeEventListener('workoutLogged', handleWorkoutLogged);
    };
  }, []);

  if (loading) {
    return <div className="dashboard-view">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="dashboard-view">Error: {error}</div>;
  }

  return (
    <div className="dashboard-view">
      {/* Smart Notifications Panel */}
      <Notifications 
        user={user} 
        meals={meals} 
        workouts={workouts} 
        profile={profile} 
      />
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Calories Consumed</h3>
          <p className="stat-value">{stats.caloriesConsumed}<span>/{stats.caloriesGoal}</span></p>
          <button className="add-button" onClick={() => navigate('/fitness?tab=meals')}>
            Add +
          </button>
        </div>
        <div className="stat-card">
          <h3>Workouts This Week</h3>
          <p className="stat-value">{stats.workoutsThisWeek}<span>/{stats.workoutsGoal}</span></p>
          <button className="add-button" onClick={() => navigate('/fitness?tab=workouts')}>
            Add +
          </button>
        </div>
        <div className="stat-card">
          <h3>Water Intake</h3>
          <p className="stat-value">{stats.waterIntake}<span>/{stats.waterGoal} glasses</span></p>
          <button className="add-water-button" onClick={increaseWaterIntake}>
            Add +
          </button>
        </div>
      </div>
      
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Nutrition Overview</h3>
          <div className="chart-placeholder">
            <p>Nutrition chart will appear here</p>
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Workout Progress</h3>
          <div className="chart-placeholder">
            <p>Workout progress chart will appear here</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-tips">
        <h3>Today's Health Tips</h3>
        <div className="tips-container">
          <div className="tip-card">
            <h4>Stay Hydrated</h4>
            <p>Drink at least 8 glasses of water today to stay hydrated and support your metabolism.</p>
          </div>
          
          <div className="tip-card">
            <h4>Balance Your Macros</h4>
            <p>Aim for a balanced meal with proteins, carbs, and healthy fats for optimal nutrition.</p>
          </div>
          
          <div className="tip-card">
            <h4>Movement Matters</h4>
            <p>Take a 10-minute walk after meals to aid digestion and maintain stable blood sugar.</p>
          </div>
        </div>
      </div>
      
      {/* AI Assistant Chat */}
      <AIAssistant 
        user={user} 
        meals={meals} 
        workouts={workouts} 
        profile={profile} 
      />
    </div>
  );
};

export default DashboardView;