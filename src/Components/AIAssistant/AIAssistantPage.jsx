import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './AIAssistantPage.css';
import AIAssistant from '../FitnessTracker/AIAssistant';

const AIAssistantPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Redirect to sign in if not authenticated
        navigate('/SignIn');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="ai-assistant-standalone">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign in
  }

  return (
    <div className="ai-assistant-standalone">
      <div className="ai-header">
        <h1>AI Fitness Assistant</h1>
        <p>Your personal nutrition and fitness advisor</p>
      </div>
      
      <div className="ai-assistant-container">
        <AIAssistant user={user} />
      </div>
      
      <div className="back-to-dashboard">
        <button onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AIAssistantPage;