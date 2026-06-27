import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDate } from '../../utils/dateUtils';
import './bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDays, setFilterDays] = useState(5);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bookingsCollectionRef = collection(db, 'contacts');
      let q;

      if (filterDays > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - filterDays);
        q = query(
          bookingsCollectionRef,
          where('createdAt', '>=', startDate),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          bookingsCollectionRef,
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBookings(bookingsData);
    } catch (err) {
      if (err.code === 'failed-precondition') {
        console.error('Query failed. You might need to create a composite index in Firestore.', err);
        setError('Failed to load bookings. A database index might be required.');
      } else {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterDays]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading) {
    return <h2>Loading Bookings...</h2>;
  }

  return (
    <div className="bookings">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Bookings {filterDays > 0 ? `(Last ${filterDays} Days)` : '(All Time)'}</h2>
            <div className="filter-controls">
              <select 
                value={filterDays} 
                onChange={(e) => setFilterDays(Number(e.target.value))}
                className="status-filter"
              >
                <option value={5}>Last 5 Days</option>
                <option value={10}>Last 10 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={0}>All Time</option>
              </select>
            </div>
        </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {bookings.length === 0 && !loading ? (
        <p>No recent bookings found.</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Age</th>
              <th>WhatsApp Number</th>
              <th>Booked on</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => (
              <tr key={booking.id}>
                <td>{index + 1}</td>
                <td>{booking.FullName}</td>
                <td>{booking.Age || 'N/A'}</td>
                <td>{booking.Whatsapp || booking.phone || 'N/A'}</td>
                <td>{booking.createdAt ? formatDate(new Date(booking.createdAt.seconds * 1000)) : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Bookings;
