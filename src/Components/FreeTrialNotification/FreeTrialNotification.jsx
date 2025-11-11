import React from 'react';
import './FreeTrialNotification.css';

const FreeTrialNotification = ({ message, onConfirm, onCancel, confirmText = "Claim Free Trial" }) => {
  return (
    <div className="free-trial-overlay">
      <div className="free-trial-notification">
        <div className="free-trial-content">
          <div className="free-trial-icon">🎉</div>
          <h2>Free Trial Available!</h2>
          <p>{message}</p>
          <div className="free-trial-actions">
            <button className="free-trial-btn confirm" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
          <button className="free-trial-close" onClick={onCancel}>
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreeTrialNotification;