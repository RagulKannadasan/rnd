import React, { useEffect, useState } from 'react';
import './PlanExpirationNotification.css';

const PlanExpirationNotification = ({ bookings, onDismiss }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [expiringPlan, setExpiringPlan] = useState(null);

  useEffect(() => {
    // Check if there are bookings and find plans that are about to expire
    if (bookings && bookings.length > 0) {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3); // 3 days warning period

      // Find the most recent paid booking
      const paidBookings = bookings.filter(booking => !booking.isFreeTrial);
      
      if (paidBookings.length > 0) {
        // Sort by booking date to get the most recent
        const sortedPaidBookings = paidBookings.sort((a, b) => {
          let dateA, dateB;
          
          if (a.bookingDate instanceof Date) {
            dateA = a.bookingDate;
          } else if (a.bookingDate?.toDate && typeof a.bookingDate.toDate === 'function') {
            dateA = a.bookingDate.toDate();
          } else if (typeof a.bookingDate === 'string') {
            dateA = new Date(a.bookingDate);
          } else if (a.bookingDate) {
            dateA = new Date(a.bookingDate);
          } else {
            dateA = new Date();
          }
          
          if (b.bookingDate instanceof Date) {
            dateB = b.bookingDate;
          } else if (b.bookingDate?.toDate && typeof b.bookingDate.toDate === 'function') {
            dateB = b.bookingDate.toDate();
          } else if (typeof b.bookingDate === 'string') {
            dateB = new Date(b.bookingDate);
          } else if (b.bookingDate) {
            dateB = new Date(b.bookingDate);
          } else {
            dateB = new Date();
          }
          
          return dateB - dateA; // Descending order
        });
        
        const mostRecentPaidBooking = sortedPaidBookings[0];
        
        // Calculate plan end date based on plan type
        const planStartDate = mostRecentPaidBooking.bookingDate || mostRecentPaidBooking.eventDate;
        let planEndDate = null;
        
        if (planStartDate) {
          // Determine plan duration based on plan name
          let planDuration = 30; // Default to 30 days (monthly)
          
          // Check plan name for duration indicators
          const planName = mostRecentPaidBooking.eventName || '';
          if (planName.toLowerCase().includes('week') || planName.toLowerCase().includes('weekly')) {
            planDuration = 7; // Weekly plan
          } else if (planName.toLowerCase().includes('month') || planName.toLowerCase().includes('monthly')) {
            planDuration = 30; // Monthly plan
          } else if (planName.toLowerCase().includes('year') || planName.toLowerCase().includes('annual')) {
            planDuration = 365; // Annual plan
          }
          
          planEndDate = new Date(planStartDate);
          planEndDate.setDate(planEndDate.getDate() + planDuration);
        }
        
        // Check if plan is expiring within 3 days
        if (planEndDate && planEndDate >= now && planEndDate <= threeDaysFromNow) {
          // Check if we've already shown this notification recently
          const notificationKey = `planExpiration_${mostRecentPaidBooking.id}_${planEndDate.toISOString().split('T')[0]}`;
          const lastShown = localStorage.getItem(notificationKey);
          const today = new Date().toISOString().split('T')[0];
          
          if (lastShown !== today) {
            setExpiringPlan({
              ...mostRecentPaidBooking,
              endDate: planEndDate
            });
            setShowNotification(true);
            
            // Store that we've shown this notification today
            localStorage.setItem(notificationKey, today);
          }
        }
      }
    }
  }, [bookings]);

  if (!showNotification || !expiringPlan) return null;

  // Format the end date as dd/mm/yy
  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return 'Date not available';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const endDateFormatted = formatDate(expiringPlan.endDate);

  return (
    <div className="plan-expiration-notification">
      <div className="notification-content">
        <div className="notification-icon">⚠️</div>
        <div className="notification-text">
          <h4>Plan Expiring Soon!</h4>
          <p>Your {expiringPlan.eventName || 'plan'} will expire on {endDateFormatted}. Renew now to continue enjoying our services.</p>
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

export default PlanExpirationNotification;