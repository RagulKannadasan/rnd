import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDate as formatDateUtil } from '../../utils/dateUtils';
import './payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDays, setFilterDays] = useState(30);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const bookingsCollectionRef = collection(db, 'bookings');
      let q;

      if (filterDays > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - filterDays);
        // Convert to Firestore Timestamp
        const startTimestamp = Timestamp.fromDate(startDate);
        q = query(
          bookingsCollectionRef,
          where('bookingDate', '>=', startTimestamp),
          orderBy('bookingDate', 'desc')
        );
      } else {
        q = query(
          bookingsCollectionRef,
          orderBy('bookingDate', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const paymentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Process dates properly
        let bookingDate = data.bookingDate;
        if (data.bookingDate && typeof data.bookingDate.toDate === 'function') {
          bookingDate = data.bookingDate.toDate();
        } else if (data.bookingDate && data.bookingDate.seconds) {
          bookingDate = new Date(data.bookingDate.seconds * 1000);
        } else if (data.bookingDate instanceof Timestamp) {
          bookingDate = data.bookingDate.toDate();
        }
        
        let eventDate = data.eventDate;
        if (data.eventDate && typeof data.eventDate.toDate === 'function') {
          eventDate = data.eventDate.toDate();
        } else if (data.eventDate && data.eventDate.seconds) {
          eventDate = new Date(data.eventDate.seconds * 1000);
        } else if (data.eventDate instanceof Timestamp) {
          eventDate = data.eventDate.toDate();
        }
        
        // Ensure amount is a number
        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        
        return {
          id: doc.id,
          ...data,
          amount: amount || 0,
          bookingDate: bookingDate,
          eventDate: eventDate,
          isFreeTrial: data.isFreeTrial || data.paymentMethod === 'free_trial' || amount === 0,
          status: data.status || 'confirmed'
        };
      });

      setPayments(paymentsData);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, [filterDays]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Filter payments based on status and payment method
  const filteredPayments = payments.filter(payment => {
    // Status filter
    if (filterStatus !== 'all' && payment.status !== filterStatus) {
      return false;
    }
    
    // Payment method filter
    if (filterPaymentMethod !== 'all' && payment.paymentMethod !== filterPaymentMethod) {
      return false;
    }
    
    return true;
  });

  // Calculate total revenue
  const totalRevenue = filteredPayments
    .filter(payment => payment.status === 'confirmed' && !payment.isFreeTrial)
    .reduce((sum, payment) => {
      const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
      return sum + (amount || 0);
    }, 0);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return formatDateUtil(new Date(date));
  };

  if (loading) {
    return <h2 style={{ color: '#ffffff' }}>Loading Payments...</h2>;
  }

  return (
    <div className="payments">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Payment Records</h2>
        <div className="filter-controls" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select 
            value={filterDays} 
            onChange={(e) => setFilterDays(Number(e.target.value))}
            className="status-filter"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={0}>All Time</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          
          <select 
            value={filterPaymentMethod} 
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Payment Methods</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Net Banking</option>
            <option value="free_trial">Free Trial</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: '#f44336' }}>{error}</p>}

      <div className="revenue-summary">
        <h3>Revenue Summary</h3>
        <p>Total Revenue (Confirmed Payments): <strong style={{ color: '#ffffff' }}>{formatCurrency(totalRevenue)}</strong></p>
        <p>Total Transactions: <strong style={{ color: '#ffffff' }}>{filteredPayments.length}</strong></p>
        <p>Free Trials: <strong style={{ color: '#ffffff' }}>{filteredPayments.filter(p => p.isFreeTrial).length}</strong></p>
      </div>

      {filteredPayments.length === 0 && !loading ? (
        <p style={{ color: '#e0e0e0' }}>No payment records found.</p>
      ) : (
        <div className="table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Event</th>
                <th>Event Date</th>
                <th>Booking Date</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, index) => (
                <tr key={payment.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div>
                      <div style={{ color: '#ffffff' }}>{payment.userName || payment.userEmail || 'N/A'}</div>
                      <div style={{ fontSize: '0.8em', color: '#aaaaaa' }}>
                        {payment.phoneNumber || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#ffffff' }}>{payment.eventName || 'N/A'}</td>
                  <td style={{ color: '#e0e0e0' }}>{formatDate(payment.eventDate)}</td>
                  <td style={{ color: '#e0e0e0' }}>{formatDate(payment.bookingDate)}</td>
                  <td>
                    {payment.isFreeTrial ? (
                      <span style={{ color: '#F15A24' }}>FREE</span>
                    ) : (
                      <span style={{ color: '#ffffff' }}>{formatCurrency(payment.amount || 0)}</span>
                    )}
                  </td>
                  <td>
                    {payment.paymentMethod === 'free_trial' ? 
                      <span style={{ color: '#F15A24' }}>Free Trial</span> :
                     payment.paymentMethod === 'card' ? 
                      <span style={{ color: '#2196f3' }}>Card</span> :
                     payment.paymentMethod === 'upi' ? 
                      <span style={{ color: '#ff9800' }}>UPI</span> :
                     payment.paymentMethod === 'netbanking' ? 
                      <span style={{ color: '#9c27b0' }}>Net Banking</span> :
                      <span style={{ color: '#e0e0e0' }}>{payment.paymentMethod || 'N/A'}</span>
                    }
                  </td>
                  <td>
                    <span className={`status-badge status-${payment.status || 'unknown'}`}>
                      {payment.status || 'N/A'}
                    </span>
                  </td>
                  <td style={{ color: '#e0e0e0' }}>{payment.id?.substring(0, 8) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payments;