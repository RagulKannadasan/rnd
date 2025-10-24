import React, { useState } from 'react';
import Notification from './Notification/Notification';
import './Notification/Notification.css';

const NotificationTest = () => {
  const [notification, setNotification] = useState(null);

  const showOtpSuccess = () => {
    setNotification({
      message: "OTP sent successfully",
      type: "otp-success"
    });
  };

  const showAlreadyRegistered = () => {
    setNotification({
      message: "This phone number is already registered. Redirecting to sign in...",
      type: "warning registered"
    });
  };

  const showNotRegistered = () => {
    setNotification({
      message: "This phone number is not registered. Please sign up first.",
      type: "warning not-registered"
    });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Notification Test</h1>
      <p>Click the buttons below to test different notifications:</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={showOtpSuccess}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          OTP Success
        </button>
        <button 
          onClick={showAlreadyRegistered}
          style={{
            padding: '10px 20px',
            backgroundColor: '#F15A24',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Already Registered
        </button>
        <button 
          onClick={showNotRegistered}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FFA500',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Not Registered
        </button>
      </div>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default NotificationTest;