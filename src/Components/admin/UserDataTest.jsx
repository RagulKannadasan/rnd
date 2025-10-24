import React, { useEffect, useState } from 'react';

const UserDataTest = () => {
  const [userData, setUserData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    // Get user data from localStorage
    const isRegistered = localStorage.getItem('isRegistered');
    const currentUser = localStorage.getItem('currentUser');
    const eventBookings = localStorage.getItem('eventBookings');
    const eventParticipants = localStorage.getItem('eventParticipants');

    console.log('Registration status:', isRegistered);
    console.log('Current user:', currentUser);
    console.log('Event bookings:', eventBookings);
    console.log('Event participants:', eventParticipants);

    if (isRegistered === 'true' && currentUser) {
      try {
        setUserData(JSON.parse(currentUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (eventBookings) {
      try {
        setBookings(JSON.parse(eventBookings));
      } catch (e) {
        console.error('Error parsing bookings:', e);
      }
    }

    if (eventParticipants) {
      setParticipants(parseInt(eventParticipants, 10));
    }
  }, []);

  const clearAllData = () => {
    localStorage.removeItem('isRegistered');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('eventBookings');
    localStorage.removeItem('eventParticipants');
    setUserData(null);
    setBookings([]);
    setParticipants(0);
    alert('All user data cleared from localStorage');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>User Data Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Registration Status</h3>
        <p>Is Registered: {localStorage.getItem('isRegistered') || 'Not set'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>User Details</h3>
        {userData ? (
          <div>
            <p>Full Name: {userData.fullName || userData.fullname || 'Not set'}</p>
            <p>Phone: {userData.phone || userData.phoneNumber || 'Not set'}</p>
            <p>Emergency Contact: {userData.emergencyContact || userData.emergency || 'Not set'}</p>
          </div>
        ) : (
          <p>No user data found</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Event Bookings</h3>
        <p>Participant Count: {participants || 0}</p>
        {bookings.length > 0 ? (
          <ul>
            {bookings.map((booking, index) => (
              <li key={index}>
                {booking.eventTitle} - {booking.participantName} ({booking.participantPhone})
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings found</p>
        )}
      </div>

      <button 
        onClick={clearAllData}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#ff4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Clear All Data
      </button>
    </div>
  );
};

export default UserDataTest;