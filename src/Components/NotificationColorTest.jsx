import React, { useState } from 'react';
import Notification from './Notification/Notification';
import './Notification/Notification.css';

const NotificationColorTest = () => {
  const [notification, setNotification] = useState(null);

  const showTestNotification = () => {
    setNotification({
      message: "This is a test notification with white text",
      type: "warning registered"
    });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#333', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>Notification Color Test</h1>
      <p style={{ color: 'white' }}>Click the button below to test the notification text color:</p>
      <button 
        onClick={showTestNotification}
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
        Show Test Notification
      </button>
      
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

export default NotificationColorTest;