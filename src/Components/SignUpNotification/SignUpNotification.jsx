import React from 'react';
import './SignUpNotification.css';

const SignUpNotification = ({ onSignUpClick, onClose }) => {
  return (
    <div className="signup-overlay">
      <div className="signup-notification">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="signup-content">
          <div className="signup-icon">🏃‍♂️</div>
          <h2>Sign up to get started!</h2>
          <p>Begin your free trial journey with us today</p>
          <button className="signup-btn" onClick={onSignUpClick}>
            Sign Up Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpNotification;