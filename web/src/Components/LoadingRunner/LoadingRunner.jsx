import React from 'react';

import './LoadingRunner.css';

const LoadingRunner = ({ inline, message, showMessage = true }) => {
  return (
    <div className={`loading-runner ${inline ? 'inline' : ''}`}>
      <div className="running-track-container">
        <div className="cartoon-runner-container">
        <svg viewBox="0 0 100 100" width="80" height="80" className="cartoon-runner-svg">
          <g className="stickman-group">
            {/* Right Arm (behind body) */}
            <g className="arm right-arm" style={{ transformOrigin: '50px 35px' }}>
              <line x1="50" y1="35" x2="50" y2="55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <g className="lower-arm right-lower-arm" style={{ transformOrigin: '50px 55px' }}>
                <line x1="50" y1="55" x2="50" y2="70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </g>
            </g>
            
            {/* Right Leg (behind body) */}
            <g className="leg right-leg" style={{ transformOrigin: '50px 60px' }}>
              <line x1="50" y1="60" x2="50" y2="80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <g className="lower-leg right-lower-leg" style={{ transformOrigin: '50px 80px' }}>
                <line x1="50" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </g>
            </g>

            {/* Torso */}
            <line x1="50" y1="30" x2="50" y2="60" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
            
            {/* Head */}
            <circle cx="50" cy="18" r="12" fill="currentColor" />

            {/* Left Leg (in front) */}
            <g className="leg left-leg" style={{ transformOrigin: '50px 60px' }}>
              <line x1="50" y1="60" x2="50" y2="80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <g className="lower-leg left-lower-leg" style={{ transformOrigin: '50px 80px' }}>
                <line x1="50" y1="80" x2="50" y2="95" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </g>
            </g>

            {/* Left Arm (in front) */}
            <g className="arm left-arm" style={{ transformOrigin: '50px 35px' }}>
              <line x1="50" y1="35" x2="50" y2="55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <g className="lower-arm left-lower-arm" style={{ transformOrigin: '50px 55px' }}>
                <line x1="50" y1="55" x2="50" y2="70" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </g>
            </g>
          </g>
        </svg>
        
        <div className="dust dust-1"></div>
        <div className="dust dust-2"></div>
        <div className="dust dust-3"></div>
      </div>
      <div className="running-track">
        <div className="track-line"></div>
        <div className="track-line"></div>
        <div className="track-line"></div>
      </div>
    </div>
      {showMessage && <p className="loading-message">{message || 'Loading...'}</p>}
    </div>
  );
};

export default LoadingRunner;
