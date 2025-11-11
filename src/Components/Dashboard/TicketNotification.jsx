import React, { useEffect, useState } from 'react';
import { FaTicketAlt } from 'react-icons/fa';
import './TicketNotification.css';

const TicketNotification = ({ bookings, onDismiss }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [newBookingsCount, setNewBookingsCount] = useState(0);

  useEffect(() => {
    // Check if there are bookings and show notification
    if (bookings && bookings.length > 0) {
      // Get the count of bookings from localStorage to compare
      const previousBookings = JSON.parse(localStorage.getItem('previousBookings') || '[]');
      const currentBookingIds = bookings.map(booking => booking.id);
      const previousBookingIds = previousBookings.map(booking => booking.id);
      
      // Find new bookings
      const newBookings = currentBookingIds.filter(id => !previousBookingIds.includes(id));
      
      if (newBookings.length > 0) {
        setNewBookingsCount(newBookings.length);
        setShowNotification(true);
        
        // Update localStorage with current bookings
        localStorage.setItem('previousBookings', JSON.stringify(bookings));
        
        // Auto-hide notification after 5 seconds
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [bookings]);

  if (!showNotification) return null;

  return (
    <div className="ticket-notification">
      <div className="notification-content">
        <FaTicketAlt className="notification-icon" />
        <div className="notification-text">
          <h4>New Ticket{newBookingsCount > 1 ? 's' : ''}!</h4>
          <p>You have {newBookingsCount} new ticket{newBookingsCount > 1 ? 's' : ''} in your dashboard</p>
        </div>
        <button 
          className="notification-close"
          onClick={() => {
            setShowNotification(false);
            if (onDismiss) onDismiss();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default TicketNotification;