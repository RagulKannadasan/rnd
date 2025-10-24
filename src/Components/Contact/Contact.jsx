import React, { useState } from 'react';
import { Element } from 'react-scroll';
import firebaseService from '../../services/firebaseService';
import Notification from '../Notification/Notification';
import './Contact.css';

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const contactData = Object.fromEntries(formData.entries());
    setSubmitting(true);
    try {
      await firebaseService.saveContactMessage(contactData);
      showNotification('Registered successfully! ✅', 'success');
      e.target.reset();
    } catch (error) {
      console.error('Form Submission Error:', error);
      showNotification('Failed to register. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="register-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      
      {/* Header Text */}
      <div className="header-text">
        <div className="header-line"></div>
        <h1>
          <span className="stroke-text">READY TO</span> <span className="white-text">LEVEL UP</span><br/>
          <span className="fill-text">YOUR BODY /</span><br/>
          <span className="fill-text">BUSINESS</span><br/>
          <span className="stroke-text">WITH US?</span>
        </h1>
      </div>

      {/* LEFT SIDE - Contact Info */}
      <div className="contact-box contact-info-box">
        <h3>Contact Us</h3>
        <a
          href="https://www.instagram.com/run_and_develop?igsh=MW9pdzV0YXBlZGZtaA=="
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="fa fa-instagram"></i>
          <span>Run and develop</span>
        </a>
      </div>

      {/* RIGHT SIDE - Register Form */}
      <Element name="register" id="register" className="register-form">
        <div className="contact-box">
          <h2>REGISTER NOW</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name:</label>
              <input
                name="FullName"
                type="text"
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                name="Age"
                type="number"
                placeholder="Enter your age"
                required
                onInput={(e) => {
                  if (e.target.value.length > 2) {
                    e.target.value = e.target.value.slice(0, 2);
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label>Profession:</label>
              <select name="Profession" required>
                <option value="">Select your profession</option>
                <option value="Student">Student</option>
                <option value="Employee">Employee</option>
                <option value="Self Employee">Self Employee</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Whatsapp Number:</label>
              <input
                name="Whatsapp"
                type="tel"
                placeholder="Enter your Whatsapp Number"
                required
                pattern="[0-9]{10}"
                maxLength={10}
              />
            </div>
           
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
      </Element>
    </div>
  );
};

export default Contact;