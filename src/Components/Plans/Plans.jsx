import React, { useState, useEffect, useCallback } from "react";
import "./Plans.css";
import { FaRunning, FaMoneyBillAlt, FaCalendarAlt, FaCreditCard, FaTimes, FaCheck, FaStar, FaQrcode } from "react-icons/fa";
import { Element } from 'react-scroll';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Notification from '../Notification/Notification';
import SignUpNotification from '../SignUpNotification/SignUpNotification';
import PlanNotification from './PlanNotification';
import PaymentButton from '../Payments/PaymentButton';
import { getCurrentUser } from '../../services/paymentService';
import firebaseService from '../../services/firebaseService';

// Utility function to check if an event date has passed
const isEventDatePassed = (eventDate) => {
  if (!eventDate) return false;
  
  let eventTime;
  if (eventDate.toDate && typeof eventDate.toDate === 'function') {
    eventTime = eventDate.toDate();
  } else if (eventDate instanceof Date) {
    eventTime = eventDate;
  } else {
    eventTime = new Date(eventDate);
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventTime.setHours(0, 0, 0, 0);
  
  return eventTime < today;
};

const Plans = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSignUpNotification, setShowSignUpNotification] = useState(false);
  const [showPlanNotification, setShowPlanNotification] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isEligibleForFreeTrial, setIsEligibleForFreeTrial] = useState(true); // Default to true for public pages
  const [purchasedPlan, setPurchasedPlan] = useState(null); // State to track which plan was purchased

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const checkFreeTrialEligibility = useCallback(async (userId, phoneNumber) => {
    try {
      // Check if user has any existing free trial bookings within the last 24 hours
      const bookingsRef = collection(db, 'bookings');
      const userQuery = query(bookingsRef, where('userId', '==', userId), where('mode', '==', 'free_trial'));
      
      const userQuerySnapshot = await getDocs(userQuery);
      
      if (!userQuerySnapshot.empty) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const hasRecentFreeTrial = userQuerySnapshot.docs.some(doc => {
          const bookingData = doc.data();
          const bookingDate = bookingData.bookingDate?.toDate ? bookingData.bookingDate.toDate() : new Date(bookingData.bookingDate);
          return bookingDate > twentyFourHoursAgo;
        });
        
        setIsEligibleForFreeTrial(!hasRecentFreeTrial);
        return;
      }
      
      // Check if phone number has been used for a free trial within the last 24 hours
      if (phoneNumber) {
        const phoneQuery = query(bookingsRef, where('phoneNumber', '==', phoneNumber), where('mode', '==', 'free_trial'));
        const phoneQuerySnapshot = await getDocs(phoneQuery);
        
        if (!phoneQuerySnapshot.empty) {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          const hasRecentFreeTrial = phoneQuerySnapshot.docs.some(doc => {
            const bookingData = doc.data();
            const bookingDate = bookingData.bookingDate?.toDate ? bookingData.bookingDate.toDate() : new Date(bookingData.bookingDate);
            return bookingDate > twentyFourHoursAgo;
          });
          
          setIsEligibleForFreeTrial(!hasRecentFreeTrial);
          return;
        }
      }
      
      setIsEligibleForFreeTrial(true);
    } catch (error) {
      console.error('Error checking free trial eligibility:', error);
      setIsEligibleForFreeTrial(true); // Default to eligible on error
      showNotification("Could not verify free trial eligibility. Please try again.", 'error');
    }
  }, []);

  const hasBookedRecently = useCallback((planName) => {
    const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
    if (!localBookings.length) return false;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return localBookings.some(booking => {
      if (booking.mode === 'free_trial' || booking.eventName !== planName) {
        return false;
      }
      const bookingDate = booking.bookingDate?.toDate ? booking.bookingDate.toDate() : new Date(booking.bookingDate);
      return bookingDate > twentyFourHoursAgo;
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const isOnDashboard = !!document.querySelector('.plans-page');
        if (isOnDashboard) {
          checkFreeTrialEligibility(currentUser.uid, currentUser.phoneNumber);
        }
      } else {
        setIsEligibleForFreeTrial(true);
        setPurchasedPlan(null);
      }
    });

    return () => unsubscribe();
  }, [checkFreeTrialEligibility]);

  useEffect(() => {
    const checkForBookingChanges = () => {
      const newBookingRaw = localStorage.getItem('newBooking');
      if (newBookingRaw) {
        try {
          const newBooking = JSON.parse(newBookingRaw);
          setPurchasedPlan(newBooking.eventName || 'Unknown Plan');
          // No need to clear here, let other components use it and clear it
        } catch (e) {
          console.error('Error parsing new booking from localStorage:', e);
        }
      }

      const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
      if (localBookings.length > 0) {
        const activeBookings = localBookings.filter(booking => !isEventDatePassed(booking.eventDate));
        if (activeBookings.length > 0) {
          const mostRecentBooking = activeBookings.reduce((latest, current) => {
            const latestDate = new Date(latest.bookingDate || latest.createdAt);
            const currentDate = new Date(current.bookingDate || current.createdAt);
            return currentDate > latestDate ? current : latest;
          });
          setPurchasedPlan(mostRecentBooking.eventName || 'Unknown Plan');
        } else {
          setPurchasedPlan(null);
        }
      } else {
        setPurchasedPlan(null);
      }
    };

    checkForBookingChanges(); // Initial check
    const interval = setInterval(checkForBookingChanges, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const plansData = [
    {
      icon: <FaRunning />,
      name: "Free Trial",
      subtitle: "For First-Time Participants",
      price: "0",
      duration: "1 Session",
      originalPrice: null,
      popular: false,
      color: "#F15A24",
      freeTrial: true,
      features: [
        "Guided warm-up session",
        "1-hour community run",
        "Light post-run treats",
        "Networking with fellow runners",
        "Basic fitness assessment"
      ],
    },
    {
      icon: <FaMoneyBillAlt />,
      name: "Pay-Per-Run",
      subtitle: "Flexible Sessions",
      price: "99",
      duration: "Per Session",
      originalPrice: "149",
      popular: true,
      color: "#F15A24",
      features: [
        "Guided warm-up & cooldown",
        "1-hour structured run",
        "Healthy energy boosters",
        "Community networking"
        
      ],
    },
    {
      icon: <FaCalendarAlt />,
      name: "Monthly Membership",
      subtitle: "Unlimited Access",
      price: "299",
      duration: "Per Month",
      originalPrice: "499",
      popular: false,
      color: "#F15A24",
      features: [
        "Unlimited weekly runs",
        "Personal fitness consultation",
        "Nutritious post-run meals",
        "Exclusive community events",
        
      ],
    },
  ];

  const closeNotification = () => {
    setNotification(null);
  };

  const handleSignUpClick = () => {
    setShowSignUpNotification(false);
    setShowPlanNotification(false);
    window.location.href = '/signup';
  };

  const handleCloseSignUpNotification = () => {
    setShowSignUpNotification(false);
  };

  const handleProceedToPayment = () => {
    setShowPlanNotification(false);
    if (selectedPlan?.freeTrial) {
      setShowSignUpNotification(true);
    }
  };

  const handleClosePlanNotification = () => {
    setShowPlanNotification(false);
    setSelectedPlan(null);
  };

  const handleFreeTrialBooking = async () => {
    const user = getCurrentUser();
    if (!user) {
      setShowSignUpNotification(true);
      return;
    }

    if (!isEligibleForFreeTrial) {
      showNotification("You've already claimed your free trial. Upgrade to a paid plan for continued access.", 'info');
      return;
    }

    try {
      const selectedEventStr = localStorage.getItem('selectedEvent');
      const eventInfo = selectedEventStr ? JSON.parse(selectedEventStr) : null;

      const bookingData = {
        eventName: eventInfo?.name || eventInfo?.title || "Free Trial",
        eventId: eventInfo ? String(eventInfo.id) : "free_trial",
        eventDate: eventInfo ? new Date(eventInfo.date) : new Date(),
        eventTime: eventInfo?.time || '',
        eventLocation: eventInfo?.location || '',
        status: 'confirmed',
        amount: 0,
        paymentId: 'free_trial_' + Date.now(),
        mode: 'free_trial',
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        phoneNumber: user.phoneNumber,
        bookingDate: new Date()
      };

      const { bookingId } = await firebaseService.createBooking(user.uid, bookingData);
      const bookingDataWithId = { ...bookingData, id: bookingId };

      localStorage.removeItem('selectedEvent');
      localStorage.setItem('refreshBookings', 'true');
      localStorage.setItem('newBooking', JSON.stringify(bookingDataWithId));
      localStorage.setItem('latestBooking', JSON.stringify(bookingDataWithId));
      
      const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
      localStorage.setItem('eventBookings', JSON.stringify([...localBookings, bookingDataWithId]));

      setPurchasedPlan("Free Trial");
      showNotification('Free trial booked successfully! Enjoy your session.', 'success');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Error creating free trial booking:', error);
      showNotification('Failed to book free trial. Please try again.', 'error');
    }
  };

  const handlePayNow = (plan) => {
    const isOnDashboard = !!document.querySelector('.plans-page');
    
    if (!isOnDashboard) {
      setShowSignUpNotification(true);
    } else {
      if (plan.freeTrial) {
        handleFreeTrialBooking();
      } else {
        setSelectedPlan(plan);
        setShowPaymentModal(true);
      }
    }
  };

  const handlePaymentSuccess = async (response) => {
    setShowPaymentModal(false);
    const user = getCurrentUser();
    if (!user || !selectedPlan) return;

    try {
      const selectedEventStr = localStorage.getItem('selectedEvent');
      const eventInfo = selectedEventStr ? JSON.parse(selectedEventStr) : null;

      const bookingData = {
        eventName: eventInfo?.name || eventInfo?.title || selectedPlan.name,
        eventId: eventInfo ? String(eventInfo.id) : `plan_${selectedPlan.name.toLowerCase().replace(/\s+/g, '_')}`,
        eventDate: eventInfo ? new Date(eventInfo.date) : new Date(),
        eventTime: eventInfo?.time || '',
        eventLocation: eventInfo?.location || '',
        status: 'confirmed',
        amount: selectedPlan.price,
        paymentId: response.razorpay_payment_id || response.razorpay_order_id,
        mode: 'razorpay',
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        phoneNumber: user.phoneNumber,
        bookingDate: new Date()
      };

      const { bookingId } = await firebaseService.createBooking(user.uid, bookingData);
      const bookingDataWithId = { ...bookingData, id: bookingId };

      localStorage.removeItem('selectedEvent');
      localStorage.setItem('refreshBookings', 'true');
      localStorage.setItem('newBooking', JSON.stringify(bookingDataWithId));
      localStorage.setItem('latestBooking', JSON.stringify(bookingDataWithId));
      
      const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
      localStorage.setItem('eventBookings', JSON.stringify([...localBookings, bookingDataWithId]));

      setPurchasedPlan(selectedPlan.name);
      showNotification('Payment successful! Thank you for your purchase.', 'success');

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Error creating booking after payment:', error);
      showNotification('Payment was successful, but failed to create booking. Please contact support.', 'error');
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    showNotification('Payment failed. Please try again.', 'error');
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };
  
  const filteredPlansData = plansData;

  return (
    <Element name="plans" className="plans-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      
      {showSignUpNotification && (
        <SignUpNotification
          onSignUpClick={handleSignUpClick}
          onClose={handleCloseSignUpNotification}
        />
      )}
      
      {showPlanNotification && selectedPlan && !selectedPlan.freeTrial && (
        <PlanNotification
          plan={selectedPlan}
          onSignUpClick={handleSignUpClick}
          onProceedToPayment={handleProceedToPayment}
          onClose={handleClosePlanNotification}
        />
      )}
      
      <div className="plans-background">
        <div className="blur plans-blur-1"></div>
        <div className="blur plans-blur-2"></div>
      </div>

      <div className="plans-content">
        <div className="plans-header">
          <div className="header-badge">
            <FaStar className="star-icon" />
            <span>Choose Your Plan</span>
          </div>
          <h2 className="main-title">
            <span className="stroke-text">Ready to Start</span>
            <span className="highlight-text">Your Journey</span>
            <span className="stroke-text">With Us</span>
          </h2>
          <p className="subtitle">Select the perfect plan that fits your fitness goals and lifestyle</p>
        </div>

        <div className="plans-grid">
          {filteredPlansData.map((plan, i) => (
            <div 
              key={i} 
              className={`plan-card ${plan.popular ? 'popular' : ''} ${plan.freeTrial && !isEligibleForFreeTrial ? 'disabled' : ''}`}
              style={{ '--plan-color': plan.color }}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <span className="badge-star">★</span>
                  MOST POPULAR
                </div>
              )}
              
              {plan.freeTrial && !isEligibleForFreeTrial && (
                <div className="plan-disabled-overlay">
                  <div className="disabled-message">Already Claimed</div>
                </div>
              )}
              
              <div className="plan-header">
                <div className="plan-icon" style={{ color: plan.color }}>
                  {plan.icon}
                </div>
                <div className="plan-title">
                  <h3>{plan.name}</h3>
                  <div className="plan-subtitle">{plan.subtitle}</div>
                </div>
              </div>
              
              <div className="price-section">
                <div className="price-comparison">
                  {plan.originalPrice && (
                    <span className="original-price">₹{plan.originalPrice}</span>
                  )}
                  {plan.originalPrice && (
                    <span className="discount-tag">
                      SAVE ₹{parseInt(plan.originalPrice) - parseInt(plan.price)}
                    </span>
                  )}
                </div>
                <div className="current-price-wrapper">
                  <span className="currency">₹</span>
                  <span className="current-price">{plan.price}</span>
                  {plan.duration && (
                    <span className="duration">/{plan.duration}</span>
                  )}
                </div>
              </div>
              
              <div className="features-section">
                <div className="features-title">What's Included</div>
                <ul className="features-list">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="feature-item">
                      <FaCheck className="check-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="plan-footer">
                <button
                  className={`cta-button ${plan.freeTrial ? 'free-trial' : ''} ${plan.popular ? 'popular-btn' : ''} ${!plan.freeTrial && (hasBookedRecently(plan.name) || purchasedPlan) ? 'disabled' : ''}`}
                  onClick={() => handlePayNow(plan)}
                  disabled={(plan.freeTrial && !isEligibleForFreeTrial) || (!plan.freeTrial && (hasBookedRecently(plan.name) || purchasedPlan))}
                >
                  <span className="button-text">
                    {plan.freeTrial ? (isEligibleForFreeTrial ? "Start Free Trial" : "Already Claimed") : 
                     (purchasedPlan === plan.name ? "Booked for 24 hrs" : 
                       (hasBookedRecently(plan.name) ? "Booked for 24 hrs" : "Choose Plan"))}
                  </span>
                  <div className="button-arrow">→</div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={closeModal}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <h3>Complete Your Purchase</h3>
                <p>Secure payment with Razorpay</p>
              </div>
              <button className="close-button" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="selected-plan-card">
                <div className="plan-summary">
                  <div className="plan-info">
                    <h4>{selectedPlan?.name}</h4>
                    <p>{selectedPlan?.subtitle || 'Subscription Plan'}</p>
                  </div>
                  <div className="price-summary">
                    {selectedPlan?.originalPrice && (
                      <span className="original-price-modal">₹{selectedPlan?.originalPrice}</span>
                    )}
                    <span className="final-price">₹{selectedPlan?.price}</span>
                  </div>
                </div>
                {selectedPlan?.originalPrice && (
                  <div className="savings-info">
                    <span className="savings-text">
                      You save ₹{parseInt(selectedPlan?.originalPrice) - parseInt(selectedPlan?.price)}!
                    </span>
                  </div>
                )}
              </div>
              
              <div className="payment-methods-section">
                <h5>PAYMENT METHOD</h5>
                <div className="payment-grid">
                  <div className="payment-method-card credit-card-method">
                    <div className="method-header">
                      <FaCreditCard />
                      <div className="method-details">
                        <span>Credit/Debit Card</span>
                        <span>Pay securely with your card</span>
                      </div>
                    </div>
                    <PaymentButton
                      amount={parseInt(selectedPlan?.price)}
                      eventName={selectedPlan?.name}
                      eventId={`plan_${selectedPlan?.name.toLowerCase().replace(/\s+/g, '_')}`}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentFailure={handlePaymentFailure}
                    />
                  </div>
                  
                  <div className="payment-method-card upi-method">
                    <div className="method-header">
                      <FaQrcode />
                      <div className="method-details">
                        <span>UPI Payment</span>
                        <span>Pay instantly using any UPI app</span>
                      </div>
                    </div>
                    <PaymentButton
                      amount={parseInt(selectedPlan?.price)}
                      eventName={selectedPlan?.name}
                      eventId={`plan_${selectedPlan?.name.toLowerCase().replace(/\s+/g, '_')}_upi`}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentFailure={handlePaymentFailure}
                    />
                  </div>
                </div>
                
                <div className="security-note">
                  <FaCheck />
                  <span>Secure payment processing powered by Razorpay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Element>
  );
};

export default Plans;