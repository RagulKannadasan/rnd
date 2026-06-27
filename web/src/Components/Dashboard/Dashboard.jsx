import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaRunning, FaUser, FaTicketAlt, FaTimes, FaDownload } from 'react-icons/fa';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';

import TicketNotification from './TicketNotification';
import PlanExpirationNotification from './PlanExpirationNotification';
import { formatDate } from '../../utils/dateUtils';
import './Dashboard.css';
import LoadingRunner from '../LoadingRunner/LoadingRunner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // State for full-screen ticket view
  const [fullScreenTicket, setFullScreenTicket] = useState(null);

  // Add state for new booking notification
  const [showNewBookingNotification, setShowNewBookingNotification] = useState(false);
  const [latestBooking, setLatestBooking] = useState(null);

  // Check for new bookings when component mounts
  useEffect(() => {
    const latestBookingData = localStorage.getItem('latestBooking');
    if (latestBookingData) {
      try {
        const booking = JSON.parse(latestBookingData);
        setLatestBooking(booking);
        setShowNewBookingNotification(true);
        
        // Clear the flag after showing notification
        localStorage.removeItem('latestBooking');
      } catch (error) {
        console.error('Error parsing latest booking data:', error);
      }
    }
  }, []);

  // Debug useEffect to see when bookings change
  useEffect(() => {
    // Removed console logs to prevent warnings
  }, [bookings]);

  // Fetch user stats from bookings in a single call
  const calculateUserStats = useCallback(async (userId) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const totalRuns = querySnapshot.size;
      const totalDistance = totalRuns * 2;
      return { totalRuns, totalDistance, currentStreak: 0 };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { totalRuns: 0, totalDistance: 0, currentStreak: 0 };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch user profile, bookings, and stats in parallel — single render flush
          const [userDoc, bookingsSnap, stats] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            getDocs(query(collection(db, 'bookings'), where('userId', '==', currentUser.uid))),
            calculateUserStats(currentUser.uid),
          ]);

          const userData = userDoc.exists() ? userDoc.data() : {};

          const userObject = {
            uid: currentUser.uid,
            name: currentUser.displayName || userData.displayName || 'User',
            email: currentUser.email || userData.email || 'No email provided',
            phone: currentUser.phoneNumber || userData.phoneNumber || 'No phone provided',
            photoURL: currentUser.photoURL || null,
            memberSince: currentUser.metadata.creationTime
              ? formatDate(new Date(currentUser.metadata.creationTime))
              : 'Unknown',
          };

          const userBookings = bookingsSnap.docs.map(docSnap => {
            const data = docSnap.data();
            let eventDate = new Date();
            if (data.eventDate) {
              if (typeof data.eventDate.toDate === 'function') eventDate = data.eventDate.toDate();
              else if (typeof data.eventDate === 'string') eventDate = new Date(data.eventDate);
              else if (data.eventDate instanceof Date) eventDate = data.eventDate;
              else if (data.eventDate.seconds) eventDate = new Date(data.eventDate.seconds * 1000);
            }
            let bookingDate = new Date();
            if (data.bookingDate) {
              if (typeof data.bookingDate.toDate === 'function') bookingDate = data.bookingDate.toDate();
              else if (typeof data.bookingDate === 'string') bookingDate = new Date(data.bookingDate);
              else if (data.bookingDate instanceof Date) bookingDate = data.bookingDate;
              else if (data.bookingDate.seconds) bookingDate = new Date(data.bookingDate.seconds * 1000);
            }
            return {
              id: docSnap.id,
              ...data,
              eventDate,
              bookingDate,
            };
          });

          // Single batched state update — one re-render
          setUser(userObject);
          setBookings(userBookings);
          setUserStats({
            totalRuns: stats.totalRuns || 0,
            totalDistance: stats.totalDistance || 0,
            currentStreak: stats.currentStreak || 0,
          });
          setLoading(false);
        } catch (error) {
          console.error('Dashboard fetch error:', error);
          setUser({
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || 'No email provided',
            phone: currentUser.phoneNumber || 'No phone provided',
            photoURL: currentUser.photoURL || null,
            memberSince: currentUser.metadata.creationTime
              ? formatDate(new Date(currentUser.metadata.creationTime))
              : 'Unknown',
          });
          setLoading(false);
        }
      } else {
        navigate('/signin');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, calculateUserStats]);

  // Periodic refresh of bookings (every 30s) without re-mounting
  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(async () => {
      try {
        const snap = await getDocs(query(collection(db, 'bookings'), where('userId', '==', user.uid)));
        const refreshed = snap.docs.map(d => {
          const data = d.data();
          let eventDate = new Date();
          if (data.eventDate) {
            if (typeof data.eventDate.toDate === 'function') eventDate = data.eventDate.toDate();
            else if (data.eventDate.seconds) eventDate = new Date(data.eventDate.seconds * 1000);
            else eventDate = new Date(data.eventDate);
          }
          return { id: d.id, ...data, eventDate };
        });
        setBookings(refreshed);
      } catch (_) {}
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // handleJoinEvent and fetchUpcomingEvents removed — no longer used

  // Function to generate QR code data in the correct format for scanning
  const generateQRData = (booking) => {
    if (!booking || !user) {
      return null;
    }

    try {
      // Format dates as ISO strings for proper JSON serialization
      const eventDateString = booking.eventDate ? 
        (booking.eventDate instanceof Date ? booking.eventDate.toISOString() : 
         (booking.eventDate.toDate && typeof booking.eventDate.toDate === 'function') ? booking.eventDate.toDate().toISOString() : 
         new Date(booking.eventDate).toISOString()) : 
        new Date().toISOString();
      
      const bookingDateString = booking.bookingDate ? 
        (booking.bookingDate instanceof Date ? booking.bookingDate.toISOString() : 
         (booking.bookingDate.toDate && typeof booking.bookingDate.toDate === 'function') ? booking.bookingDate.toDate().toISOString() : 
         new Date(booking.bookingDate).toISOString()) : 
        new Date().toISOString();

      const qrData = {
        id: booking.id || 'N/A',
        event: booking.eventName || 'Event Name',
        date: eventDateString,
        time: booking.eventTime || 'Time not available',
        location: booking.eventLocation || 'Location not available',
        user: user.name || 'User',
        userId: user.uid || 'N/A',
        userEmail: user.email || booking.userEmail || 'Email not available',
        phoneNumber: user.phone || user.phoneNumber || booking.phoneNumber || 'Phone not available',
        eventId: booking.eventId || 'Event ID not available',
        bookingDate: bookingDateString,
        isFreeTrial: booking.isFreeTrial || false,
        status: booking.status || 'confirmed',
        // Add additional verification data
        ticketType: booking.isFreeTrial ? 'FREE_TRIAL' : 'PAID',
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };

      return qrData;
    } catch (error) {
      // Removed console error to prevent warnings
      return null;
    }
  };

  // Function to open full-screen ticket view
  const openFullScreenTicket = (booking) => {
    setFullScreenTicket(booking);
  };

  // Function to close full-screen ticket view
  const closeFullScreenTicket = () => {
    setFullScreenTicket(null);
  };

  // Function to download ticket as PDF (simplified version)
  const downloadTicketAsPDF = (booking) => {
    // Add safety checks
    if (!booking) {
      return;
    }
    
    if (!user) {
      return;
    }
    
    try {
      // Create a simple text version for download
      const ticketInfo = `
R&D Event Ticket

Event: ${booking.eventName || 'Event Name'}
Date: ${booking.eventDate ? formatDate(new Date(booking.eventDate)) : 'Date not available'}
Time: ${booking.eventTime || 'Time not available'}
Location: ${booking.eventLocation || 'Location not available'}

Booking ID: ${booking.id || 'N/A'}
Name: ${user.name || 'N/A'}
Email: ${user.email || 'N/A'}
Phone: ${user.phone || user.phoneNumber || booking.phoneNumber || 'Phone not available'}

${booking.isFreeTrial ? 'FREE TRIAL' : 'PAID TICKET'}

Booking Date: ${booking.bookingDate ? formatDate(new Date(booking.bookingDate)) : 'Date not available'}

Thank you for booking with R&D - Run and Develop!
      `;
      
      // Create and download file
      const blob = new Blob([ticketInfo], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${(booking.eventName || 'event').replace(/\s+/g, '_')}-${booking.id || 'unknown'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating ticket PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">

        <div className="dashboard-main"><div className="dashboard-content"><div className="loading-state"><LoadingRunner message="Loading dashboard..." /></div></div></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard">

        <div className="dashboard-main"><div className="dashboard-content"><div className="error-state"><p>Please log in to view your dashboard.</p><button onClick={() => navigate('/SignIn')}>Go to SignIn</button></div></div></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-background">
        <div className="blur dashboard-blur-1"></div>
        <div className="blur dashboard-blur-2"></div>
      </div>

      <TicketNotification bookings={bookings} onDismiss={() => {}} />
      {showNewBookingNotification && latestBooking && (
        <div className="new-booking-notification">
          <div className="notification-content">
            <FaTicketAlt className="notification-icon" />
            <div className="notification-text">
              <h4>Booking Confirmed!</h4>
              <p>You have successfully booked {latestBooking.eventName || 'an event'}</p>
              <p className="ticket-id">Ticket ID: {latestBooking.id}</p>
            </div>
            <div className="notification-actions">
              <button 
                className="view-ticket-btn"
                onClick={() => {
                  openFullScreenTicket(latestBooking);
                  setShowNewBookingNotification(false);
                }}
              >
                View Ticket
              </button>
              <button 
                className="close-btn"
                onClick={() => setShowNewBookingNotification(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
      <PlanExpirationNotification bookings={bookings} onDismiss={() => {}} />
      <div className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-grid">
            {/* Top Row: Profile and Stats */}
            <div className="dashboard-row row-top">
              {/* Profile Card */}
              <motion.div className="profile-card card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="profile-header">
                  <div className="profile-avatar">{user.photoURL ? <img src={user.photoURL} alt="Profile" /> : <FaUser />}</div>
                  <div className="profile-info">
                    <h2>{user.name}</h2>
                    <p className="member-since">Member since {user.memberSince && typeof user.memberSince === 'string' ? user.memberSince : 'Unknown'}</p>
                  </div>
                </div>
              </motion.div>

              {/* Stats Card */}
              <motion.div className="stats-card card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div className="profile-stats">
                  <div className="stat-item">
                    <span className="stat-number">{userStats.totalRuns}</span>
                    <span className="stat-label">Total Runs</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userStats.totalDistance} km</span>
                    <span className="stat-label">Distance</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userStats.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
                  <button 
                    onClick={async () => {
                      if (user && user.uid) {
                        const stats = await calculateUserStats(user.uid);
                        setUserStats({
                          totalRuns: stats.totalRuns || 0,
                          totalDistance: stats.totalDistance || 0,
                          currentStreak: stats.currentStreak || 0,
                        });
                      }
                    }}
                    className="refresh-stats-btn"
                  >
                    Refresh Stats
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Middle Row: Events and Plan */}
            <div className="dashboard-row row-middle">
              {/* Unified Upcoming Event Card */}
              <motion.div className="event-card card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <div className="card-header">
                  <FaTicketAlt className="card-icon" />
                  <h3>Upcoming Event</h3>
                </div>
                <div className="events-list" style={{ maxHeight: 'none', minHeight: 'auto' }}>
                  {bookings && bookings.length > 0 ? (
                    (() => {
                      // Sort bookings by event date (most recent first)
                      const sortedBookings = [...bookings].sort((a, b) => {
                        let dateA, dateB;
                        try {
                          if (a.eventDate instanceof Date) dateA = a.eventDate;
                          else if (a.eventDate.toDate && typeof a.eventDate.toDate === 'function') dateA = a.eventDate.toDate();
                          else if (typeof a.eventDate === 'string') dateA = new Date(a.eventDate);
                          else if (a.eventDate.seconds) dateA = new Date(a.eventDate.seconds * 1000 + (a.eventDate.nanoseconds || 0) / 1000000);
                          else dateA = new Date(a.eventDate);
                          
                          if (b.eventDate instanceof Date) dateB = b.eventDate;
                          else if (b.eventDate.toDate && typeof b.eventDate.toDate === 'function') dateB = b.eventDate.toDate();
                          else if (typeof b.eventDate === 'string') dateB = new Date(b.eventDate);
                          else if (b.eventDate.seconds) dateB = new Date(b.eventDate.seconds * 1000 + (b.eventDate.nanoseconds || 0) / 1000000);
                          else dateB = new Date(b.eventDate);
                        } catch (e) {
                          return 0;
                        }
                        return dateB - dateA;
                      });
                      
                      const mostRecentBooking = sortedBookings[0];
                      
                      let displayDate;
                      try {
                        if (mostRecentBooking.eventDate instanceof Date) displayDate = mostRecentBooking.eventDate;
                        else if (mostRecentBooking.eventDate.toDate && typeof mostRecentBooking.eventDate.toDate === 'function') displayDate = mostRecentBooking.eventDate.toDate();
                        else if (typeof mostRecentBooking.eventDate === 'string') displayDate = new Date(mostRecentBooking.eventDate);
                        else if (mostRecentBooking.eventDate.seconds) displayDate = new Date(mostRecentBooking.eventDate.seconds * 1000 + (mostRecentBooking.eventDate.nanoseconds || 0) / 1000000);
                        else displayDate = new Date(mostRecentBooking.eventDate);
                      } catch (e) {
                        displayDate = new Date();
                      }
                      
                      return (
                        <div key={mostRecentBooking.id} className="event-item">
                          <div className="event-info">
                            <h4>{mostRecentBooking.eventName || 'Event Name'}</h4>
                            <p className="event-details">
                              {displayDate ? formatDate(displayDate) : 'Date not available'} 
                              • {mostRecentBooking.eventTime || 'Time not available'} • {mostRecentBooking.eventLocation || 'Location TBD'}
                            </p>
                            <p className="event-status">
                              Status: <span className={mostRecentBooking.status || 'confirmed'}>
                                {mostRecentBooking.status ? mostRecentBooking.status.charAt(0).toUpperCase() + mostRecentBooking.status.slice(1) : 'Confirmed'}
                              </span>
                            </p>
                          </div>
                          <button className="join-event-btn" onClick={() => openFullScreenTicket(mostRecentBooking)}>View Details</button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="no-events-container">
                      <p className="no-events-message">No upcoming events.</p>
                      <button className="book-event-btn" onClick={() => navigate('/plans')}>
                        Find Events
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* My Plan Card */}
              <motion.div className="plan-card card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <div className="card-header">
                  <FaRunning className="card-icon" />
                  <h3>My Plan</h3>
                </div>
                <div className="plan-section">
                  {bookings && bookings.some(booking => !booking.isFreeTrial) ? (
                    (() => {
                      const paidBookings = bookings.filter(b => !b.isFreeTrial);
                      if (paidBookings.length > 0) {
                        const mostRecentPaidBooking = paidBookings[0];
                        return (
                          <div style={{ padding: '1rem 0' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.1rem' }}>{mostRecentPaidBooking.eventName || 'Paid Plan'}</h4>
                            <button className="upgrade-btn" onClick={() => navigate('/plans')} style={{ width: '100%' }}>
                              Manage Plan
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()
                  ) : bookings && bookings.some(booking => booking.isFreeTrial) ? (
                    <div style={{ padding: '1rem 0' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.1rem' }}>Free Trial</h4>
                      <button className="upgrade-btn" onClick={() => navigate('/plans')} style={{ width: '100%' }}>
                        Manage Plan
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem 0' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.1rem' }}>No Active Plan</h4>
                      <button className="upgrade-btn" onClick={() => navigate('/plans')} style={{ width: '100%' }}>
                        Choose Plan
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Bottom Row: Fitness */}
            <div className="dashboard-row row-bottom">
              {/* Fitness Tracker Card */}
              <motion.div className="fitness-card card-glow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <div className="card-header">
                  <h3>Fitness & Nutrition</h3>
                </div>
                <div className="events-list" style={{ minHeight: 'auto' }}>
                  <div className="event-item" style={{ border: 'none', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div className="event-info">
                      <h4>Track Your Progress</h4>
                      <p className="event-details">
                        Monitor your meals, workouts, and nutrition goals
                      </p>
                    </div>
                    <button className="join-event-btn" onClick={() => navigate('/fitness')}>
                      Open Tracker
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal Overlay */}
      <div 
        className="full-screen-ticket-modal"
        onClick={closeFullScreenTicket}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: fullScreenTicket ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <div 
          className="full-screen-ticket-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, var(--appColor) 0%, var(--darkGrey) 100%)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '90%',
            width: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            margin: '1rem'
          }}
        >
          {/* Close Button */}
          <button 
            className="close-ticket-btn"
            onClick={closeFullScreenTicket}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              transition: 'all 0.3s ease',
              zIndex: 1001
            }}
          >
            <FaTimes />
          </button>
          
          {fullScreenTicket && (
            <>
              <div className="full-screen-ticket-header" style={{
                textAlign: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: 'var(--orange)', 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '1.8rem' 
                }}>
                  {fullScreenTicket?.eventName || 'Event Name'}
                </h2>
                <p className="ticket-id" style={{
                  color: '#aaa',
                  fontSize: '0.9rem',
                  margin: '0'
                }}>
                  Booking ID: {fullScreenTicket?.id || 'N/A'}
                </p>
              </div>
              
              <div className="full-screen-ticket-body" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div className="ticket-info-section">
                  <div className="ticket-info-group" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      color: 'var(--orange)', 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.2rem' 
                    }}>
                      Event Details
                    </h3>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Date:</strong> 
                      {fullScreenTicket?.eventDate ? formatDate(new Date(fullScreenTicket.eventDate)) : 'Date not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Time:</strong> {fullScreenTicket?.eventTime || 'Time not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Location:</strong> {fullScreenTicket?.eventLocation || 'Location not available'}
                    </p>
                  </div>
                  
                  <div className="ticket-info-group" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                      color: 'var(--orange)', 
                      margin: '0 0 1rem 0', 
                      fontSize: '1.2rem' 
                    }}>
                      Booking Information
                    </h3>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Name:</strong> {user?.name || 'N/A'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Email:</strong> {user?.email || 'N/A'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Phone:</strong> {user?.phone || user?.phoneNumber || fullScreenTicket?.phoneNumber || 'Phone not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Booking Date:</strong> 
                      {fullScreenTicket?.bookingDate ? formatDate(new Date(fullScreenTicket.bookingDate)) : 'Date not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>User ID:</strong> {fullScreenTicket?.userId || 'Not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Event ID:</strong> {fullScreenTicket?.eventId || 'Not available'}
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#ccc', fontSize: '1rem' }}>
                      <strong>Status:</strong> 
                      <span className={fullScreenTicket?.status || 'confirmed'}>
                        {fullScreenTicket?.status ? fullScreenTicket.status.charAt(0).toUpperCase() + fullScreenTicket.status.slice(1) : 'Confirmed'}
                      </span>
                    </p>
                  </div>
                  
                  {fullScreenTicket?.isFreeTrial && (
                    <div className="free-trial-badge-fullscreen" style={{
                      background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      display: 'inline-block',
                      animation: 'pulse 2s infinite',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: 'white'
                      }}>
                        FREE TRIAL
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="ticket-qr-section" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem'
                }}>
                  <h3 style={{ 
                    color: 'var(--orange)', 
                    margin: '0 0 1rem 0', 
                    fontSize: '1.2rem' 
                  }}>
                    🎫 Your Ticket QR Code
                  </h3>
                  
                  <div style={{ 
                    padding: '1rem', 
                    background: 'white', 
                    borderRadius: '10px' 
                  }}>
                    {(() => {
                      const qrData = generateQRData(fullScreenTicket);
                      if (qrData) {
                        try {
                          return (
                            <>
                              <QRCodeCanvas
                                value={JSON.stringify(qrData)}
                                size={200}
                                level="M"
                                includeMargin={true}
                              />
                              <p className="qr-instructions" style={{
                                color: '#aaa',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                margin: '0.5rem 0 0 0'
                              }}>
                                Scan this QR code at the event entrance
                              </p>
                            </>
                          );
                        } catch (qrError) {
                          console.error('Error rendering QR code:', qrError);
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '200px',
                              height: '200px',
                              background: '#f0f0f0',
                              border: '1px dashed #ccc',
                              borderRadius: '5px',
                              textAlign: 'center'
                            }}>
                              <p style={{ color: '#666', fontSize: '0.9rem' }}>
                                Error generating QR code
                              </p>
                            </div>
                          );
                        }
                      } else {
                        return (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '200px',
                            height: '200px',
                            background: '#f0f0f0',
                            border: '1px dashed #ccc',
                            borderRadius: '5px',
                            textAlign: 'center'
                          }}>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                              QR Code unavailable
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="full-screen-ticket-footer" style={{
                textAlign: 'center',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <button 
                  onClick={() => {
                    if (fullScreenTicket && user) {
                      downloadTicketAsPDF(fullScreenTicket);
                    } else {
                      console.error('Cannot download ticket: missing data');
                    }
                  }} 
                  className="download-ticket-fullscreen-btn"
                  style={{
                    padding: '0.8rem 1.5rem',
                    background: 'var(--orange)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FaDownload /> Download Ticket
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;