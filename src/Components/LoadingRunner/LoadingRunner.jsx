import React from 'react';
import './LoadingRunner.css';

const LoadingRunner = ({ inline, message, showMessage }) => {
  return (
    <div className={`loading-runner ${inline ? 'inline' : ''}`}>
      <div className="runner"></div>
      {showMessage && <p className="loading-message">{message || 'Loading...'}</p>}
    </div>
  );
};

export default LoadingRunner;
