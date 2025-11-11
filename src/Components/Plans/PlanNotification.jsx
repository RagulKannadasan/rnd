import React from 'react';
import './PlanNotification.css';

const PlanNotification = ({ plan, onSignUpClick, onProceedToPayment, onClose }) => {
  return (
    <div className="plan-overlay">
      <div className="plan-notification">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="plan-content">
          <div className="plan-icon">🏃‍♂️</div>
          <h2>{plan.freeTrial ? 'Start Your Free Trial' : `Choose ${plan.name}`}</h2>
          <p>
            {plan.freeTrial 
              ? 'Begin your free trial journey with us today' 
              : `Proceed with payment for the ${plan.name} plan`}
          </p>
          <div className="plan-details">
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">
              ₹{plan.price}/{plan.duration}
              {plan.originalPrice && (
                <span className="original-price">₹{plan.originalPrice}</span>
              )}
            </div>
          </div>
          <div className="notification-buttons">
            {plan.freeTrial ? (
              <button className="action-btn" onClick={onSignUpClick}>
                Sign Up Now
              </button>
            ) : (
              <button className="action-btn" onClick={onProceedToPayment}>
                Proceed to Payment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanNotification;