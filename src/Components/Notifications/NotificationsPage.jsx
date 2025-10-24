import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import DashboardNav from '../DashboardNav/DashboardNav';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Pass userId directly instead of setting user state
        await fetchNotifications(user.uid);
      } else {
        navigate('/signin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchNotifications = async (userId) => {
    try {
      console.log('Fetching notifications for user:', userId);
      // Fetch notifications for the user
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const userNotifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched notifications:', userNotifications);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Show error to user
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <DashboardNav />
        <div className="notifications-page">
          <div className="notifications-container">
            <h1>Notifications</h1>
            <p>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <DashboardNav />
      <div className="notifications-page">
        <div className="notifications-container">
          <h1>Notifications</h1>
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>You have no notifications at this time.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className="notification-time">
                      {formatTimestamp(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    {notification.eventName && (
                      <div className="notification-event">
                        <strong>Event:</strong> {notification.eventName}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="notification-actions">
                      <button 
                        className="mark-as-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        Mark as Read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;