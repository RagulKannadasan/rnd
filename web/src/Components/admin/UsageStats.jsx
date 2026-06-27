import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsageStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data.stats);
      } catch (err) {
        setError('Failed to fetch usage statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="usage-stats">Loading usage statistics...</div>;
  if (error) return <div className="usage-stats error">{error}</div>;
  if (!stats) return <div className="usage-stats">No statistics available</div>;

  return (
    <div className="usage-stats">
      <h3>Usage Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Registered Users</h4>
          <p className="stat-value">{stats.userCount}</p>
        </div>
        <div className="stat-card">
          <h4>Storage Type</h4>
          <p className="stat-value">{stats.storage}</p>
        </div>
      </div>
      <div className="quota-info">
        <p><strong>Quota Information:</strong> {stats.quotaInfo}</p>
        {stats.storage === "Firestore" && (
          <div className="firebase-info">
            <p>On Firebase Free Tier:</p>
            <ul>
              <li>Maximum document writes per day: ~20,000</li>
              <li>Maximum simultaneous connections: 100</li>
              <li>Storage limit: 1GB</li>
            </ul>
            <p>To increase limits, consider upgrading to the Blaze plan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageStats;