import React, { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier } from "firebase/auth";
import { auth } from "../firebase";
import Notification from "./Notification/Notification";
import "./Notification/Notification.css";

const RecaptchaTest = () => {
  const [notification, setNotification] = useState(null);
  const recaptchaContainerRef = useRef(null);

  useEffect(() => {
    // Clean up previous recaptcha verifier if it exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    
    // Initialize recaptcha after component mount when DOM is ready
    const initRecaptcha = () => {
      try {
        // Check if container element exists
        if (!recaptchaContainerRef.current) {
          console.warn("Recaptcha container not found, retrying...");
          setTimeout(initRecaptcha, 100);
          return;
        }
        
        window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          'size': 'invisible',
          'callback': (response) => {
            console.log("Recaptcha verified");
            showNotification("Recaptcha verified successfully!", "success");
          },
          'expired-callback': () => {
            console.log("Recaptcha expired");
            showNotification("Recaptcha expired. Please try again.", "error");
          },
          'error-callback': (error) => {
            console.error("Recaptcha error:", error);
            showNotification("Recaptcha error. Please refresh the page and try again.", "error");
          }
        });
        
        showNotification("Recaptcha initialized successfully!", "success");
      } catch (error) {
        console.error("Error initializing RecaptchaVerifier:", error);
        showNotification("Failed to initialize reCAPTCHA. Please check your internet connection and refresh the page.", "error");
      }
    };
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(initRecaptcha, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const testRecaptcha = async () => {
    try {
      if (window.recaptchaVerifier) {
        showNotification("Testing reCAPTCHA...", "info");
        // This would normally be used with signInWithPhoneNumber
        // For testing purposes, we're just showing that the verifier exists
        showNotification("RecaptchaVerifier is ready!", "success");
      } else {
        showNotification("RecaptchaVerifier is not initialized.", "error");
      }
    } catch (error) {
      console.error("Error testing reCAPTCHA:", error);
      showNotification("Error testing reCAPTCHA: " + error.message, "error");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>reCAPTCHA Test</h1>
      <p>This page tests the reCAPTCHA initialization.</p>
      
      <button 
        onClick={testRecaptcha}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '20px'
        }}
      >
        Test reCAPTCHA
      </button>
      
      <div ref={recaptchaContainerRef} style={{ visibility: 'hidden', position: 'absolute' }}></div>
      
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

export default RecaptchaTest;