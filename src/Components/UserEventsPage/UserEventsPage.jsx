import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { formatDate } from '../../utils/dateUtils';
import './UserEventsPage.css';

const upcomingEvents = [
  {
    id: 1,
    title: 'Weekly run',
    date: '2025-09-21T00:30:00',
    time: '07:00 AM',
    location: 'C3 cafe',
    description: 'Join fellow runners for an unforgettable experience.',
    image: '/upcoming-events.jpeg',
    status: 'Open for Registration',
    participants: 25,
    maxParticipants: 50,
    detailedDescription: 'Experience the ultimate running challenge as we welcome 2025! This marathon event combines fitness, community, and celebration. The route takes you through the most scenic parts of Trichy, including heritage sites and modern landmarks. Whether you\'re a seasoned marathoner or a beginner, this event offers multiple distance options: 5K Fun Run, 10K Challenge, and Full Marathon (42K). Pre-event warm-up sessions, professional timing, medical support, hydration stations every 2K, post-race celebrations with live music, healthy refreshments, and awards ceremony. Special goody bags for all participants including event t-shirt, medal, and local sponsor gifts.',
    requirements: [
      'Comfortable running gear and shoes',
      'Water bottle (additional hydration provided)',
      'Valid ID for registration verification'
    ],
  }
];

function UserEventsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEventExpanded, setIsEventExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userBookings, setUserBookings] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({}); // For tracking user notification preferences

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 767);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
      
        const userObject = {
          uid: currentUser.uid,
          name: currentUser.displayName || userData.displayName || 'User',
          email: currentUser.email || userData.email,
          phoneNumber: currentUser.phoneNumber || userData.phoneNumber || '',
        };
        
        setUser(userObject);
        await fetchUserBookings(currentUser.uid);
      } else {
        setUser(null);
        setUserBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.uid) {
      fetchUserBookings(user.uid);
    }
  }, [user]);

  const fetchUserBookings = async (userId) => {
    try {
      const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
      if (localBookings.length > 0) {
        setUserBookings(localBookings);
      }
      
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserBookings(bookings);
      localStorage.setItem('eventBookings', JSON.stringify(bookings));
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      const localBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
      setUserBookings(localBookings);
    }
  };

  const hasUserBookedEvent = (eventId) => {
    if (!user || !userBookings || userBookings.length === 0) {
      return false;
    }

    const targetEventId = String(eventId);
    return userBookings.some(booking => String(booking.eventId) === targetEventId);
  };

  const checkFreeTrialEligibility = async (userId, phoneNumber) => {
    if (!phoneNumber) {
      return false;
    }
    
    try {
      const bookingsRef = collection(db, 'bookings');
      
      // Check if the user ID has any booking
      const userQuery = query(bookingsRef, where('userId', '==', userId));
      const userQuerySnapshot = await getDocs(userQuery);
      if (!userQuerySnapshot.empty) {
        return false; // User already has bookings
      }
      
      // Check if the phone number has been used
      const phoneQuery = query(bookingsRef, where('phoneNumber', '==', phoneNumber));
      const phoneQuerySnapshot = await getDocs(phoneQuery);
      if (!phoneQuerySnapshot.empty) {
        return false; // Phone number already used
      }

      return true; // Eligible
    } catch (error) {
      console.error('Error checking free trial eligibility:', error);
      return false;
    }
  };

  const handleRegister = async (event) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (!user.phoneNumber) {
      alert('To book a free trial, please update your profile with a phone number.');
      navigate('/profile');
      return;
    }

    const isEligible = await checkFreeTrialEligibility(user.uid, user.phoneNumber);

    if (isEligible) {
      const confirmFreeTrial = window.confirm(
        'You are eligible for a free trial! Would you like to claim it for this event?'
      );
      if (confirmFreeTrial) {
        navigate('/payments', { state: { event, isFreeTrial: true } });
      }
    } else {
      navigate('/payments', { state: { event, isFreeTrial: false } });
    }
    
    // Refresh bookings after navigation
    setTimeout(() => {
      if (user) {
        fetchUserBookings(user.uid);
      }
    }, 2000);
  };

  // Function to set event reminder notification preference
  const setEventReminder = async (event) => {
    if (!user) {
      alert('You must be logged in to set reminders.');
      return;
    }

    try {
      // Check if user has already set a reminder for this event
      const hasReminder = notificationPreferences[event.id];
      
      if (hasReminder) {
        // Remove existing reminder
        setNotificationPreferences(prev => ({ ...prev, [event.id]: false }));
        // In a full implementation, you would also remove the notification from Firestore
        alert('Reminder removed for this event.');
      } else {
        // Set new reminder
        setNotificationPreferences(prev => ({ ...prev, [event.id]: true }));
        
        // Create a notification in Firestore for the user
        const notificationData = {
          userId: user.uid,
          title: 'Event Reminder',
          message: `Don't forget about your upcoming event: ${event.title}`,
          eventName: event.title,
          eventId: event.id,
          eventDate: event.date,
          createdAt: new Date(),
          read: false
        };

        // Add the notification to the notifications collection
        await addDoc(collection(db, 'notifications'), notificationData);
        
        alert('Reminder set! You will receive a notification before the event.');
      }
    } catch (err) {
      console.error('Error setting reminder:', err);
      alert('Failed to set reminder. Please try again.');
    }
  };

  return (
    <div className="user-events-container">
      {/* Upcoming Events Section */}
      <div className="upcoming-events-section">
        <div className="upcoming-events-header">
          <h1>Upcoming Events</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <p>Join our community runs and be part of something amazing!</p>
          </div>
        </div>
      
        <div className="upcoming-events-container">
          {upcomingEvents.length > 0 ? (
            <div 
              className={`upcoming-event-card ${isEventExpanded ? 'expanded' : ''}`}
              onMouseEnter={() => !isMobile && setIsEventExpanded(true)}
              onMouseLeave={() => !isMobile && setIsEventExpanded(false)}
            >
              <div className="upcoming-event-image">
                <img 
                  src={upcomingEvents[0].image} 
                  alt={upcomingEvents[0].title} 
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/upcoming-events.jpeg';
                  }}
                />
                <div className="event-status-badge">{upcomingEvents[0].status}</div>
              </div>
              
              <div className="upcoming-event-content">
                <div className="upcoming-event-header">
                  <h3>{upcomingEvents[0].title}</h3>
                  <div className="event-date-time">
                    <p className="event-date">{formatDate(new Date(upcomingEvents[0].date))}</p>
                    <p className="event-time">{upcomingEvents[0].time}</p>
                  </div>
                  <p className="event-location">{upcomingEvents[0].location}</p>
                  <p className="event-description">{upcomingEvents[0].description}</p>
                </div>
                
                <div className="event-stats">
                  <div className="participants-info">
                    <span className="participants-count">
                      {upcomingEvents[0].participants} / {upcomingEvents[0].maxParticipants} Participants
                    </span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${(upcomingEvents[0].participants / upcomingEvents[0].maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="event-actions">
                  <button 
                    className="register-btn"
                    onClick={() => handleRegister(upcomingEvents[0])}
                    disabled={hasUserBookedEvent(upcomingEvents[0].id)}
                  >
                    {hasUserBookedEvent(upcomingEvents[0].id) ? 'Already Booked' : 'Book Your Slot'}
                  </button>
                  
                  {hasUserBookedEvent(upcomingEvents[0].id) && (
                    <button 
                      className={`reminder-btn ${notificationPreferences[upcomingEvents[0].id] ? 'active' : ''}`}
                      onClick={() => setEventReminder(upcomingEvents[0])}
                    >
                      {notificationPreferences[upcomingEvents[0].id] ? 'Remove Reminder' : 'Set Reminder'}
                    </button>
                  )}
                </div>
                
                {/* Additional details revealed on hover */}
                <div className="event-additional-details">
                  <div className="event-details-grid">
                    <div className="detail-item">
                      <h4>What to Bring</h4>
                      <ul>
                        {upcomingEvents[0].requirements?.map((req, i) => <li key={i}>{req}</li>)}
                      </ul>
                    </div>
                    <div className="detail-item">
                      <h4>Event Details</h4>
                      <p>{upcomingEvents[0].detailedDescription}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p>No upcoming events at the moment.</p>
          )}
        </div>
      </div>
      {/* Past Events Section (for display only) */}
    </div>
  );
}

export default UserEventsPage;