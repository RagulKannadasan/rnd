import React from 'react';
import AIAssistant from './AIAssistant';

const AIAssistantPage = ({ user }) => {
  return (
    <div className="ai-assistant-page">
      <div className="fitness-header">
        <h1>AI Fitness Assistant</h1>
        <p>Your personal nutrition and fitness advisor</p>
      </div>
      
      <div className="ai-assistant-container">
        <AIAssistant user={user} />
      </div>
    </div>
  );
};

export default AIAssistantPage;