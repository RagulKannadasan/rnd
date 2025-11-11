import React, { useEffect, useState, useCallback } from 'react';
import './Notification.css';

const Notification = ({ message, type = 'info', onClose, duration = 5000 }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for the animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  // Function to determine the CSS class based on type
  const getCssClass = () => {
    // Handle compound types like "warning registered" or "warning not-registered"
    if (type.includes(' ')) {
      return type.split(' ').join(' notification-');
    }
    return type;
  };

  return (
    <div className={`notification notification-${getCssClass()} ${isClosing ? 'closing' : ''}`}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon(type)}</span>
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

const getIcon = (type) => {
  // Extract the base type for icon selection
  const baseType = type.split(' ')[0];
  
  switch (baseType) {
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    case 'otp-success':
      return '✅';
    default:
      return 'ℹ️';
  }
};

export default Notification;