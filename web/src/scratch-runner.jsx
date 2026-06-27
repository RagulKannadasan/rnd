import React from 'react';
import './test-runner.css';

const ScratchRunner = () => (
  <div className="scratch-container">
    <svg viewBox="0 0 100 100" width="100" height="100" className="cartoon-runner-svg">
      <g className="stickman-group">
        {/* Right Arm (behind body) */}
        <g className="arm right-arm" style={{ transformOrigin: '50px 35px' }}>
          <line x1="50" y1="35" x2="50" y2="55" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          <g className="lower-arm right-lower-arm" style={{ transformOrigin: '50px 55px' }}>
            <line x1="50" y1="55" x2="50" y2="70" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>
        
        {/* Right Leg (behind body) */}
        <g className="leg right-leg" style={{ transformOrigin: '50px 60px' }}>
          <line x1="50" y1="60" x2="50" y2="80" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          <g className="lower-leg right-lower-leg" style={{ transformOrigin: '50px 80px' }}>
            <line x1="50" y1="80" x2="50" y2="95" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>

        {/* Torso */}
        <line x1="50" y1="30" x2="50" y2="60" stroke="#F15A24" strokeWidth="8" strokeLinecap="round" />
        
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill="#F15A24" />

        {/* Left Leg (in front) */}
        <g className="leg left-leg" style={{ transformOrigin: '50px 60px' }}>
          <line x1="50" y1="60" x2="50" y2="80" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          <g className="lower-leg left-lower-leg" style={{ transformOrigin: '50px 80px' }}>
            <line x1="50" y1="80" x2="50" y2="95" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>

        {/* Left Arm (in front) */}
        <g className="arm left-arm" style={{ transformOrigin: '50px 35px' }}>
          <line x1="50" y1="35" x2="50" y2="55" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          <g className="lower-arm left-lower-arm" style={{ transformOrigin: '50px 55px' }}>
            <line x1="50" y1="55" x2="50" y2="70" stroke="#F15A24" strokeWidth="6" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </svg>
  </div>
);

export default ScratchRunner;
