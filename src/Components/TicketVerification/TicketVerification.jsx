import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import './TicketVerification.css';

const TicketVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseTicketData = () => {
      try {
        // Get QR data from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const qrData = searchParams.get('data');
        
        if (!qrData) {
          setError('No ticket data provided');
          setLoading(false);
          return;
        }
        
        // Parse the QR code data
        const parsedData = JSON.parse(decodeURIComponent(qrData));
        
        setTicketInfo({
          id: parsedData.id || 'N/A',
          eventName: parsedData.event || 'Unknown Event',
          eventDate: parsedData.date ? new Date(parsedData.date) : new Date(),
          eventTime: parsedData.time || 'Unknown Time',
          eventLocation: parsedData.location || 'Location not available',
          userName: parsedData.user || 'Unknown User',
          userEmail: parsedData.userEmail || 'Email not available',
          phoneNumber: parsedData.phoneNumber || 'Phone not available',
          userId: parsedData.userId || 'User ID not available',
          bookingDate: parsedData.bookingDate ? new Date(parsedData.bookingDate) : new Date(),
          isFreeTrial: parsedData.isFreeTrial || false,
          status: parsedData.status || 'confirmed'
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error parsing ticket data:', err);
        setError('Invalid ticket data. Please make sure you scanned a valid QR code.');
        setLoading(false);
      }
    };
    
    parseTicketData();
  }, [location.search]);

  if (loading) {
    return (
      <div className="ticket-verification-container">
        <div className="loading">Loading ticket information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-verification-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-verification-container">
      <div className="ticket-card">
        <div className="ticket-header">
          <h1>Event Ticket</h1>
          <div className="ticket-status">
            <span className={`status ${ticketInfo.status}`}>
              {ticketInfo.status.charAt(0).toUpperCase() + ticketInfo.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="ticket-content">
          <div className="event-info">
            <h2>{ticketInfo.eventName}</h2>
            <p className="event-date">
              {formatDate(ticketInfo.eventDate)}
            </p>
            <p className="event-time">{ticketInfo.eventTime}</p>
            <p className="event-location">{ticketInfo.eventLocation}</p>
          </div>
          
          <div className="attendee-info">
            <h3>Attendee Information</h3>
            <p><strong>Name:</strong> {ticketInfo.userName}</p>
            <p><strong>Email:</strong> {ticketInfo.userEmail}</p>
            <p><strong>Phone:</strong> {ticketInfo.phoneNumber}</p>
          </div>
          
          <div className="booking-info">
            <h3>Booking Details</h3>
            <p><strong>Booking ID:</strong> {ticketInfo.id}</p>
            <p><strong>Booking Date:</strong> {formatDate(ticketInfo.bookingDate)}</p>
            {ticketInfo.isFreeTrial && (
              <p className="free-trial-badge">FREE TRIAL</p>
            )}
          </div>
        </div>
        
        <div className="ticket-footer">
          <p>This ticket is valid for entry to the event.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketVerification;