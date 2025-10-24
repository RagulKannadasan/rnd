import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDate } from '../../utils/dateUtils';
import './analytics.css'; // <--- CSS IMPORT ADDED HERE

const Analytics = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    registrationTrends: [],
    usersByPlan: { Basic: 0, Standard: 0, Premium: 0 },
    registrationTypes: { contact_form: 0, mobile_otp: 0 },
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchAnalytics();
  }, []);
  
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate basic stats
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(user => user.status === 'active').length;
      
      // Calculate plan distribution
      const usersByPlan = {
        Basic: allUsers.filter(u => (u.planType || 'Basic') === 'Basic').length,
        Standard: allUsers.filter(u => u.planType === 'Standard').length,
        Premium: allUsers.filter(u => u.planType === 'Premium').length
      };
      
      // Calculate registration types
      const registrationTypes = {
        contact_form: allUsers.filter(u => u.registrationType === 'contact_form').length,
        mobile_otp: allUsers.filter(u => u.registrationType !== 'contact_form').length
      };
      
      // Calculate monthly trends (last 6 months)
      const now = new Date();
      const registrationTrends = [];
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthUsers = allUsers.filter(user => {
          const createdAt = user.createdAt?.toDate?.() || new Date(user.createdAt);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });
        
        registrationTrends.push({
          month: formatDate(monthStart),
          count: monthUsers.length
        });
      }
      
      // Calculate monthly growth
      const thisMonth = registrationTrends[registrationTrends.length - 1]?.count || 0;
      const lastMonth = registrationTrends[registrationTrends.length - 2]?.count || 0;
      const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
      
      setAnalytics({
        totalUsers,
        activeUsers,
        registrationTrends,
        usersByPlan,
        registrationTypes,
        monthlyGrowth
      });
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="analytics">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="analytics">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Analytics</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>Analytics Dashboard</h2>
      </div>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Registration Trends (Last 6 Months)</h3>
          <div className="chart-placeholder">
            <div className="bar-chart">
              {analytics.registrationTrends.map((month, index) => {
                const maxCount = Math.max(...analytics.registrationTrends.map(m => m.count)) || 1;
                const height = (month.count / maxCount) * 100;
                return (
                  <div key={index} className="bar-container">
                    <div className="bar" style={{height: `${height}%`}}>
                      <span className="bar-value">{month.count}</span>
                    </div>
                    <span className="bar-label">{month.month}</span>
                  </div>
                );
              })}
            </div>
            <p>New registrations over the last 6 months</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Plan Distribution</h3>
          <div className="plan-stats">
            {Object.entries(analytics.usersByPlan).map(([plan, count]) => {
              const percentage = analytics.totalUsers > 0 ? (count / analytics.totalUsers * 100) : 0;
              return (
                <div key={plan} className="plan-item">
                  <div className="plan-header">
                    <span className="plan-name">{plan} Plan</span>
                    <span className="plan-count">{count} users</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress" 
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: plan === 'Premium' ? '#F15A24' : plan === 'Standard' ? '#667eea' : '#a0aec0'
                      }}
                    ></div>
                  </div>
                  <span className="plan-percentage">{percentage.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Registration Sources</h3>
          <div className="registration-sources">
            <div className="source-item">
              <div className="source-icon">📝</div>
              <div className="source-info">
                <h4>Contact Form</h4>
                <p>{analytics.registrationTypes.contact_form} registrations</p>
                <div className="source-bar">
                  <div 
                    className="source-progress" 
                    style={{
                      width: `${analytics.totalUsers > 0 ? (analytics.registrationTypes.contact_form / analytics.totalUsers * 100) : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="source-item">
              <div className="source-icon">📱</div>
              <div className="source-info">
                <h4>Mobile/OTP</h4>
                <p>{analytics.registrationTypes.mobile_otp} registrations</p>
                <div className="source-bar">
                  <div 
                    className="source-progress" 
                    style={{
                      width: `${analytics.totalUsers > 0 ? (analytics.registrationTypes.mobile_otp / analytics.totalUsers * 100) : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="analytics-card">
          <h3>Growth Metrics</h3>
          <div className="growth-metrics">
            <div className="metric-item">
              <div className="metric-icon">👥</div>
              <div className="metric-info">
                <h4>{analytics.totalUsers}</h4>
                <p>Total Users</p>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">⭐</div>
              <div className="metric-info">
                <h4>{analytics.activeUsers}</h4>
                <p>Active Users</p>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">
                {analytics.monthlyGrowth >= 0 ? '📈' : '📉'}
              </div>
              <div className="metric-info">
                <h4 className={analytics.monthlyGrowth >= 0 ? 'positive' : 'negative'}>
                  {analytics.monthlyGrowth >= 0 ? '+' : ''}{analytics.monthlyGrowth.toFixed(1)}%
                </h4>
                <p>Monthly Growth</p>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon">₹</div>
              <div className="metric-info">
                <h4>₹{(analytics.activeUsers * 50).toLocaleString()}</h4>
                <p>Est. Revenue</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;