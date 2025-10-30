import React, { useState, useEffect } from 'react';
import fitnessService from '../../services/fitnessService';

const MealTracker = ({ user }) => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingNutrition, setFetchingNutrition] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast',
    date: new Date().toISOString().split('T')[0],
    quantity: '1',
    unit: 'piece' // Default unit
  });

  // Load user meals when component mounts
  useEffect(() => {
    const loadMeals = async () => {
      if (user && user.uid) {
        try {
          setLoading(true);
          const userMeals = await fitnessService.getUserMeals(user.uid);
          setMeals(userMeals);
        } catch (error) {
          console.error('Error loading meals:', error);
          setMessage('Error loading meals: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    loadMeals();
  }, [user]);

  // Function to convert fractions to decimals
  const parseQuantity = (quantityStr) => {
    // Handle fraction inputs like ½, ¼, etc.
    const fractions = {
      '½': 0.5,
      '¼': 0.25,
      '¾': 0.75,
      '⅓': 0.333,
      '⅔': 0.667,
      '⅕': 0.2,
      '⅖': 0.4,
      '⅗': 0.6,
      '⅘': 0.8,
      '⅙': 0.167,
      '⅚': 0.833,
      '⅛': 0.125,
      '⅜': 0.375,
      '⅝': 0.625,
      '⅞': 0.875
    };
    
    // Check if it's a fraction
    if (fractions[quantityStr]) {
      return fractions[quantityStr];
    }
    
    // Handle mixed numbers like "1 ½"
    const mixedNumberRegex = /^(\d+)\s+([½¼¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/;
    const mixedMatch = quantityStr.match(mixedNumberRegex);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const fraction = fractions[mixedMatch[2]];
      return whole + fraction;
    }
    
    // Handle decimal numbers
    const decimal = parseFloat(quantityStr);
    return isNaN(decimal) ? 1 : decimal;
  };

  const fetchNutritionData = async (foodName) => {
    if (!foodName.trim()) return;
    
    setFetchingNutrition(true);
    setMessage('');
    
    try {
      // DeepSeek API configuration
      const apiKey = 'sk-1116ca52ef05484c83f0b8b3603f7ad0'; // Your DeepSeek API key
      const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: `Given a food name, return approximate nutrition facts per 100 grams in strict JSON format with keys: food, calories, protein_g, carbs_g, fat_g. Only return valid JSON without any markdown formatting. Food: ${foodName}`
            }
          ],
          temperature: 0.1,
          max_tokens: 200
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const nutritionInfo = data.choices[0].message.content.trim();
      
      // Clean the response to remove any markdown formatting
      let cleanedNutritionInfo = nutritionInfo;
      if (cleanedNutritionInfo.startsWith('```json')) {
        cleanedNutritionInfo = cleanedNutritionInfo.substring(7);
      }
      if (cleanedNutritionInfo.startsWith('```')) {
        cleanedNutritionInfo = cleanedNutritionInfo.substring(3);
      }
      if (cleanedNutritionInfo.endsWith('```')) {
        cleanedNutritionInfo = cleanedNutritionInfo.slice(0, -3);
      }
      cleanedNutritionInfo = cleanedNutritionInfo.trim();
      
      // Try to parse the JSON response
      try {
        const nutritionData = JSON.parse(cleanedNutritionInfo);
        
        // Update the form fields with the fetched nutrition data
        setNewMeal(prev => ({
          ...prev,
          name: foodName,
          calories: nutritionData.calories || '',
          protein: nutritionData.protein_g || '',
          carbs: nutritionData.carbs_g || '',
          fat: nutritionData.fat_g || ''
        }));
        
        setMessage(`Nutrition facts for ${nutritionData.food} fetched successfully!`);
      } catch (parseError) {
        console.error('Error parsing nutrition data:', parseError);
        console.error('Raw nutrition info:', nutritionInfo);
        setMessage('Failed to parse nutrition data. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      setMessage('Error fetching nutrition data: ' + error.message);
    } finally {
      setFetchingNutrition(false);
    }
  };

  const handleFoodNameChange = (e) => {
    const { value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      name: value
    }));
    
    // Fetch nutrition data when meal name is updated
    clearTimeout(window.nutritionFetchTimeout);
    window.nutritionFetchTimeout = setTimeout(() => {
      if (value.trim()) {
        fetchNutritionData(value);
      }
    }, 500);
  };

  const handleQuantityChange = (e) => {
    const { name, value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUnitChange = (e) => {
    const { value } = e.target;
    setNewMeal(prev => ({
      ...prev,
      unit: value
    }));
  };

  const calculateNutritionWithQuantity = () => {
    const baseCalories = parseFloat(newMeal.calories) || 0;
    const baseProtein = parseFloat(newMeal.protein) || 0;
    const baseCarbs = parseFloat(newMeal.carbs) || 0;
    const baseFat = parseFloat(newMeal.fat) || 0;
    
    const quantity = parseQuantity(newMeal.quantity);
    
    // For all calculations, we use 100g as the base unit since that's what the API returns
    const baseUnitInGrams = 100;
    
    // Convert entered quantity to grams based on the selected unit
    let quantityInGrams = quantity;
    
    switch (newMeal.unit) {
      case 'g':
        // Already in grams
        break;
      case 'kg':
        quantityInGrams = quantity * 1000;
        break;
      case 'mg':
        quantityInGrams = quantity / 1000;
        break;
      case 'ml':
        // Assume 1ml ≈ 1g for most foods
        break;
      case 'l':
        quantityInGrams = quantity * 1000;
        break;
      case 'cup':
        quantityInGrams = quantity * 240; // Approximate 1 cup = 240g
        break;
      case 'tbsp':
        quantityInGrams = quantity * 15; // Approximate 1 tbsp = 15g
        break;
      case 'tsp':
        quantityInGrams = quantity * 5; // Approximate 1 tsp = 5g
        break;
      case 'oz':
        quantityInGrams = quantity * 28.35; // 1 oz = 28.35g
        break;
      case 'lb':
        quantityInGrams = quantity * 453.59; // 1 lb = 453.59g
        break;
      case 'piece':
        // For pieces, we assume an average weight
        // This is a simplification - in reality, this would vary by food type
        quantityInGrams = quantity * 100; // Assume 1 piece = 100g on average
        break;
      default:
        // Default to grams if unknown unit
        break;
    }
    
    // Calculate nutrition based on grams
    // Formula: (base nutrition per 100g) * (quantity in grams / 100)
    const multiplier = quantityInGrams / baseUnitInGrams;
    
    return {
      calories: Math.round(baseCalories * multiplier),
      protein: parseFloat((baseProtein * multiplier).toFixed(2)),
      carbs: parseFloat((baseCarbs * multiplier).toFixed(2)),
      fat: parseFloat((baseFat * multiplier).toFixed(2)),
      quantityInGrams: quantityInGrams
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (user && user.uid) {
        // Calculate nutrition values based on quantity
        const calculatedNutrition = calculateNutritionWithQuantity();
        
        const mealData = {
          name: newMeal.name,
          calories: calculatedNutrition.calories,
          protein: calculatedNutrition.protein,
          carbs: calculatedNutrition.carbs,
          fat: calculatedNutrition.fat,
          mealType: newMeal.mealType,
          date: newMeal.date,
          quantity: parseQuantity(newMeal.quantity),
          unit: newMeal.unit,
          grams: calculatedNutrition.quantityInGrams
        };
        
        const result = await fitnessService.logMeal(user.uid, mealData);
        if (result.success) {
          setMessage('Meal logged successfully!');
          // Refresh meals list
          const updatedMeals = await fitnessService.getUserMeals(user.uid);
          setMeals(updatedMeals);
          // Reset form
          setNewMeal({
            name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            mealType: 'breakfast',
            date: new Date().toISOString().split('T')[0],
            quantity: '1',
            unit: 'piece'
          });
          
          // Dispatch a custom event to notify the dashboard to refresh
          window.dispatchEvent(new CustomEvent('mealLogged', { detail: { userId: user.uid } }));
        }
      }
    } catch (error) {
      setMessage('Error logging meal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMeal = async (mealId) => {
    // In a real implementation, you would delete from Firebase
    // For now, we'll just remove from local state
    setMeals(meals.filter(meal => meal.id !== mealId));
    setMessage('Meal deleted successfully!');
    
    // Dispatch a custom event to notify the dashboard to refresh
    window.dispatchEvent(new CustomEvent('mealDeleted', { detail: { userId: user.uid } }));
  };

  // Calculate daily totals
  const calculateDailyTotals = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(meal => {
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
    
    return todayMeals.reduce((totals, meal) => {
      return {
        calories: totals.calories + (meal.calories || 0),
        protein: totals.protein + (meal.protein || 0),
        carbs: totals.carbs + (meal.carbs || 0),
        fat: totals.fat + (meal.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const dailyTotals = calculateDailyTotals();

  // Group meals by date
  const groupMealsByDate = () => {
    const grouped = {};
    meals.forEach(meal => {
      // Check if meal has a loggedAt timestamp
      let mealDateStr = 'Unknown date';
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
        mealDateStr = mealDate.toISOString().split('T')[0];
      }
      // Fallback to date field if loggedAt is not available
      else if (meal.date) {
        mealDateStr = meal.date;
      }
      
      if (!grouped[mealDateStr]) {
        grouped[mealDateStr] = [];
      }
      grouped[mealDateStr].push(meal);
    });
    return grouped;
  };

  const groupedMeals = groupMealsByDate();

  // Display calculated nutrition values
  const displayNutrition = calculateNutritionWithQuantity();

  // Unit options for different food types
  const unitOptions = [
    { value: 'piece', label: 'Piece(s)' },
    { value: 'g', label: 'Gram(s)' },
    { value: 'kg', label: 'Kilogram(s)' },
    { value: 'mg', label: 'Milligram(s)' },
    { value: 'ml', label: 'Milliliter(s)' },
    { value: 'l', label: 'Liter(s)' },
    { value: 'cup', label: 'Cup(s)' },
    { value: 'tbsp', label: 'Tablespoon(s)' },
    { value: 'tsp', label: 'Teaspoon(s)' },
    { value: 'oz', label: 'Ounce(s)' },
    { value: 'lb', label: 'Pound(s)' }
  ];

  return (
    <div className="meal-tracker">
      <h2>Meal Tracker</h2>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
      
      <div className="meal-tracker-content">
        <div className="meal-form-section">
          <h3>Log New Meal</h3>
          <form onSubmit={handleSubmit} className="meal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Meal Name</label>
                <input
                  type="text"
                  name="name"
                  value={newMeal.name}
                  onChange={handleFoodNameChange}
                  placeholder="e.g., Biryani, Egg Dosa, Milk"
                  required
                />
                {fetchingNutrition && <span className="loading-text">Fetching nutrition data...</span>}
              </div>
              
              <div className="form-group">
                <label>Meal Type</label>
                <select
                  name="mealType"
                  value={newMeal.mealType}
                  onChange={handleQuantityChange}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="text"
                  name="quantity"
                  value={newMeal.quantity}
                  onChange={handleQuantityChange}
                  placeholder="e.g., 1, 2, 1.5, ½"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Unit</label>
                <select
                  value={newMeal.unit}
                  onChange={handleUnitChange}
                >
                  {unitOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Calories</label>
                <input
                  type="number"
                  name="calories"
                  value={displayNutrition.calories}
                  onChange={handleQuantityChange}
                  placeholder="0"
                />
                <small>
                  Based on {parseQuantity(newMeal.quantity)} {newMeal.unit}(s) = {displayNutrition.quantityInGrams?.toFixed(1)}g
                  {newMeal.calories && ` (Original: ${newMeal.calories} cal/100g)`}
                </small>
              </div>
              
              <div className="form-group">
                <label>Protein (g)</label>
                <input
                  type="number"
                  name="protein"
                  value={displayNutrition.protein}
                  onChange={handleQuantityChange}
                  placeholder="0"
                />
                <small>
                  Based on {parseQuantity(newMeal.quantity)} {newMeal.unit}(s)
                </small>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Carbs (g)</label>
                <input
                  type="number"
                  name="carbs"
                  value={displayNutrition.carbs}
                  onChange={handleQuantityChange}
                  placeholder="0"
                />
                <small>
                  Based on {parseQuantity(newMeal.quantity)} {newMeal.unit}(s)
                </small>
              </div>
              
              <div className="form-group">
                <label>Fat (g)</label>
                <input
                  type="number"
                  name="fat"
                  value={displayNutrition.fat}
                  onChange={handleQuantityChange}
                  placeholder="0"
                />
                <small>
                  Based on {parseQuantity(newMeal.quantity)} {newMeal.unit}(s)
                </small>
              </div>
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={newMeal.date}
                onChange={handleQuantityChange}
              />
            </div>
            
            <button 
              type="submit" 
              className="log-meal-button"
              disabled={loading || fetchingNutrition}
            >
              {loading ? 'Logging...' : 'Log Meal'}
            </button>
          </form>
        </div>
        
        <div className="daily-summary">
          <h3>Today's Nutrition Summary</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <h4>Calories</h4>
              <p className="value">{dailyTotals.calories}</p>
            </div>
            
            <div className="summary-card">
              <h4>Protein</h4>
              <p className="value">{dailyTotals.protein}g</p>
            </div>
            
            <div className="summary-card">
              <h4>Carbs</h4>
              <p className="value">{dailyTotals.carbs}g</p>
            </div>
            
            <div className="summary-card">
              <h4>Fat</h4>
              <p className="value">{dailyTotals.fat}g</p>
            </div>
          </div>
        </div>
        
        <div className="meal-history">
          <h3>Meal History</h3>
          {Object.keys(groupedMeals).length === 0 ? (
            <p className="no-meals">No meals logged yet. Start by logging your first meal!</p>
          ) : (
            Object.entries(groupedMeals)
              .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA)) // Sort by date descending
              .map(([date, mealsForDate]) => (
                <div key={date} className="meal-date-group">
                  <h4>{date}</h4>
                  {mealsForDate
                    .sort((a, b) => {
                      // Sort by loggedAt timestamp if available, otherwise by date
                      if (a.loggedAt && b.loggedAt) {
                        const dateA = a.loggedAt.toDate ? a.loggedAt.toDate() : new Date(a.loggedAt);
                        const dateB = b.loggedAt.toDate ? b.loggedAt.toDate() : new Date(b.loggedAt);
                        return dateB - dateA;
                      }
                      return 0;
                    })
                    .map(meal => (
                      <div key={meal.id} className="meal-item">
                        <div className="meal-info">
                          <h5>{meal.name}</h5>
                          <p className="meal-type">{meal.mealType}</p>
                          <div className="meal-details">
                            <span>{meal.calories || 0} cal</span>
                            <span>{meal.protein || 0}g protein</span>
                            <span>{meal.carbs || 0}g carbs</span>
                            <span>{meal.fat || 0}g fat</span>
                          </div>
                          <div className="meal-quantity">
                            Quantity: {meal.quantity} {meal.unit}(s) ({meal.grams?.toFixed(1)}g)
                          </div>
                        </div>
                        <button 
                          className="delete-meal-button"
                          onClick={() => deleteMeal(meal.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  }
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MealTracker;