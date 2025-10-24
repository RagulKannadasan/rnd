import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
// Import jsPDF only when needed to avoid issues in test environment
import { auth, db } from '../../firebase';
import Notification from '../Notification/Notification';
import { formatDate } from '../../utils/dateUtils';
import './Payments.css';

const Payments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [event, setEvent] = useState(null);
  const [isEligibleForFreeTrial, setIsEligibleForFreeTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    upiId: '',
    bank: ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData = {};
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
          
          setUser({
            uid: currentUser.uid,
            name: currentUser.displayName || userData.displayName || 'User',
            email: currentUser.email || userData.email || 'No email provided',
            phoneNumber: currentUser.phoneNumber || userData.phoneNumber || '',
            photoURL: currentUser.photoURL || null,
          });
          
          // Get event data from location state
          if (location.state && location.state.event) {
            setEvent(location.state.event);
            // Check free trial eligibility from navigation state
            if (location.state.isFreeTrial) {
              setIsEligibleForFreeTrial(true);
            } else {
              await checkFreeTrialEligibility(currentUser.uid, currentUser.phoneNumber || userData.phoneNumber || '');
            }
          } else {
            // If no event data, redirect to events page
            navigate('/events');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email || 'No email provided',
            phoneNumber: currentUser.phoneNumber || '',
            photoURL: currentUser.photoURL || null,
          });
        }
      } else {
        navigate('/SignIn');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location]);

  const checkFreeTrialEligibility = async (userId, phoneNumber) => {
    if (!phoneNumber) {
      setIsEligibleForFreeTrial(false);
      return false;
    }
    
    try {
      // Check if user has any existing bookings
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsEligibleForFreeTrial(false);
        return false;
      }
      
      // Check if phone number has been used for a free trial
      const phoneQuery = query(
        bookingsRef,
        where('phoneNumber', '==', phoneNumber)
      );
      const phoneQuerySnapshot = await getDocs(phoneQuery);
      
      const eligible = phoneQuerySnapshot.empty;
      setIsEligibleForFreeTrial(eligible);
      return eligible;
    } catch (error) {
      console.error('Error checking free trial eligibility:', error);
      setIsEligibleForFreeTrial(false);
      return false;
    }
  };

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!user || !event) return;
    
    setProcessing(true);
    
    try {
      // Create booking
      const bookingsRef = collection(db, 'bookings');
      const bookingData = {
        userId: user.uid,
        eventId: String(event.id), // Ensure eventId is stored as string
        eventName: event.title,
        eventDate: new Date(event.date), // Ensure this is a Date object
        eventTime: event.time,
        eventLocation: event.location,
        userName: user.name || user.displayName,
        userEmail: user.email,
        phoneNumber: user.phoneNumber,
        bookingDate: new Date(), // This will be a Date object
        status: 'confirmed',
        isFreeTrial: isEligibleForFreeTrial,
        amount: isEligibleForFreeTrial ? 0 : 100, // Assuming ₹100 for paid events
        paymentMethod: isEligibleForFreeTrial ? 'free_trial' : paymentMethod
      };

      console.log('Creating booking with data:', bookingData); // Debug log
      const docRef = await addDoc(bookingsRef, bookingData);
      
      console.log('Booking created with ID:', docRef.id); // Debug log
      
      // Verify the booking was created
      const bookingDoc = await getDoc(docRef);
      if (bookingDoc.exists()) {
        console.log('Booking verified in database:', bookingDoc.data());
        // Set the booking data for display
        const bookingDataWithId = {
          id: docRef.id,
          ...bookingDoc.data()
        };
        setBookingData(bookingDataWithId);
        
        // Store booking data in localStorage for immediate access
        const allBookings = JSON.parse(localStorage.getItem('eventBookings') || '[]');
        allBookings.push(bookingDataWithId);
        localStorage.setItem('eventBookings', JSON.stringify(allBookings));
        
        // Store in a special key to trigger notification
        localStorage.setItem('newBooking', JSON.stringify(bookingDataWithId));
      } else {
        console.log('Booking not found in database after creation');
      }
      
      setPaymentSuccess(true);
      
      // Don't redirect automatically, let user choose what to do
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('Failed to process payment. Please try again.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return formatDate(date);
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as XXXX XXXX XXXX XXXX
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    
    return formatted;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentDetails(prev => ({
      ...prev,
      cardNumber: formatted
    }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    setPaymentDetails(prev => ({
      ...prev,
      expiryDate: value
    }));
  };

  // NEW: Function to download ticket as PDF (import jsPDF only when needed)
  const downloadTicketAsPDF = async () => {
    if (!bookingData || !user || !event) return;
    
    try {
      // Dynamically import jsPDF only when needed
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(22);
      doc.setTextColor(241, 90, 36); // Orange color
      doc.text('R&D Event Ticket', 105, 20, null, null, 'center');
      
      // Add event details
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(event.title, 105, 35, null, null, 'center');
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      // Format date
      const eventDate = bookingData.eventDate?.toDate ? bookingData.eventDate.toDate() : new Date(bookingData.eventDate);
      const formattedDate = formatDate(eventDate);
      
      doc.text(`${formattedDate} at ${event.time}`, 105, 45, null, null, 'center');
      doc.text(event.location, 105, 52, null, null, 'center');
      
      // Add booking details
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Booking Details:', 20, 70);
      
      doc.setFontSize(10);
      doc.text(`Booking ID: ${bookingData.id}`, 20, 80);
      doc.text(`Name: ${bookingData.userName || user.name}`, 20, 87);
      doc.text(`Email: ${bookingData.userEmail || user.email}`, 20, 94);
      doc.text(`Phone: ${bookingData.phoneNumber || user.phoneNumber}`, 20, 101);
      
      if (bookingData.isFreeTrial) {
        doc.setTextColor(76, 175, 80); // Green color
        doc.text('FREE TRIAL', 20, 110);
      }
      
      // Capture the QR code from the DOM and add to PDF
      const qrCanvasElement = document.querySelector('.ticket-qr canvas');
      if (qrCanvasElement) {
        // Convert canvas to image
        const qrImage = qrCanvasElement.toDataURL('image/png');
        // Add QR code to PDF
        doc.addImage(qrImage, 'PNG', 20, 135, 50, 50);
      } else {
        // Fallback: Add QR code placeholder text
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('QR Code:', 20, 130);
        doc.rect(20, 135, 50, 50); // QR code placeholder rectangle
      }
      
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Scan this QR code at the event entrance', 20, 190);
      
      // Add footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for booking with R&D - Run and Develop', 105, 280, null, null, 'center');
      doc.text('This is an automatically generated ticket', 105, 285, null, null, 'center');
      
      // Save the PDF
      doc.save(`ticket-${event.title.replace(/\s+/g, '_')}-${bookingData.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      showNotification('Failed to generate PDF. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="payments-page">
        <div className="loading-container">
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (!user || !event) {
    return (
      <div className="payments-page">
        <div className="error-container">
          <p>Unable to load payment information. Please try again.</p>
          <button onClick={() => navigate('/events')} className="back-btn" type="button">
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-page">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div className="payments-container">
        <div className="payment-header">
          <h1>Event Payment</h1>
          <button 
            className="back-btn" 
            onClick={() => navigate('/events')}
            type="button"
          >
            ← Back to Events
          </button>
        </div>

        {paymentSuccess ? (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>Booking Successful!</h2>
            <p>Your spot has been confirmed for {event.title}.</p>
            
            {/* Display the ticket immediately after booking */}
            {bookingData && (
              <div className="ticket-display">
                <h3>Your Ticket</h3>
                <div className="ticket-content">
                  <div className="ticket-qr">
                    <QRCodeCanvas
                      value={`${window.location.origin}/ticket?data=${encodeURIComponent(JSON.stringify({ 
                        id: bookingData.id, 
                        event: bookingData.eventName, 
                        date: bookingData.eventDate?.toDate ? bookingData.eventDate.toDate() : new Date(bookingData.eventDate),
                        time: bookingData.eventTime,
                        user: bookingData.userName || user.name,
                        userId: bookingData.userId || user.uid,
                        location: bookingData.eventLocation,
                        userEmail: bookingData.userEmail || user.email,
                        phoneNumber: bookingData.phoneNumber || user.phoneNumber,
                        bookingDate: bookingData.bookingDate?.toDate ? bookingData.bookingDate.toDate() : new Date(bookingData.bookingDate),
                        isFreeTrial: bookingData.isFreeTrial,
                        status: bookingData.status
                      }))}`}
                      size={128}
                      aria-label="Event ticket QR code"
                    />
                  </div>
                  <div className="ticket-details">
                    <p><strong>Event:</strong> {bookingData.eventName}</p>
                    <p><strong>Date:</strong> {bookingData.eventDate?.toDate ? formatDate(bookingData.eventDate.toDate()) : formatDate(new Date(bookingData.eventDate))}</p>
                    <p><strong>Time:</strong> {bookingData.eventTime}</p>
                    <p><strong>Location:</strong> {bookingData.eventLocation}</p>
                    <p><strong>Booking ID:</strong> {bookingData.id}</p>
                    <p><strong>Name:</strong> {bookingData.userName || user.name}</p>
                    <p><strong>Email:</strong> {bookingData.userEmail || user.email}</p>
                    <p><strong>Phone:</strong> {bookingData.phoneNumber || user.phoneNumber}</p>
                    {bookingData.isFreeTrial && <p className="free-trial-tag">FREE TRIAL</p>}
                  </div>
                </div>
              </div>
            )}
            
            {/* Move ticket actions outside of ticket display to ensure visibility */}
            {bookingData && (
              <div className="ticket-actions">
                <button onClick={downloadTicketAsPDF} className="download-pdf-btn" type="button">
                  Download as PDF
                </button>
                <button 
                  onClick={() => {
                    // Clear the new booking flag
                    localStorage.removeItem('newBooking');
                    navigate('/dashboard');
                  }} 
                  className="view-dashboard-btn"
                  type="button"
                >
                  View in Dashboard
                </button>
              </div>
            )}
            
            <div className="success-message">
              <p>🎉 Congratulations on your booking!</p>
              <p>You can view all your tickets in your dashboard.</p>
            </div>
            
            {/* Prominent View Dashboard Button - always visible without scrolling */}
            {bookingData && (
              <div className="prominent-dashboard-button">
                <button 
                  onClick={() => {
                    // Clear the new booking flag
                    localStorage.removeItem('newBooking');
                    navigate('/dashboard');
                  }} 
                  className="view-dashboard-btn prominent"
                  type="button"
                >
                  View Your Tickets in Dashboard
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="payment-content">
            {/* Event Details */}
            <div className="event-details-card">
              <h2>Event Details</h2>
              <div className="event-info">
                <h3>{event.title}</h3>
                <p className="event-date">{formatEventDate(event.date)}</p>
                <p className="event-time">{event.time}</p>
                <p className="event-location">{event.location}</p>
                <div className="event-description">
                  <p>{event.description}</p>
                </div>
                <div className="event-price">
                  {isEligibleForFreeTrial ? (
                    <div className="free-trial-badge">
                      <span>FREE TRIAL</span>
                      <p>You're eligible for a free trial!</p>
                    </div>
                  ) : (
                    <div className="price">
                      <span>₹100</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="payment-form-card">
              <h2>{isEligibleForFreeTrial ? 'Confirm Your Free Trial' : 'Payment Information'}</h2>
              
              {isEligibleForFreeTrial ? (
                <div className="free-trial-confirmation">
                  <p>🎉 Congratulations! You're eligible for a free trial.</p>
                  <p>Click the button below to confirm your free spot for this event.</p>
                  <button 
                    onClick={handlePayment} 
                    className="pay-now-btn"
                    disabled={processing}
                    type="button"
                  >
                    {processing ? 'Confirming...' : 'Claim Your Free Trial'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePayment} className="payment-form">
                  {/* Payment Method Selection */}
                  <div className="payment-methods">
                    <h3>Select Payment Method</h3>
                    <div className="method-options">
                      <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          disabled={!isEligibleForFreeTrial}
                        />
                        <span>Credit/Debit Card</span>
                        {!isEligibleForFreeTrial && <span className="coming-soon-tag">Coming Soon</span>}
                      </label>
                      <label className={`method-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          disabled={!isEligibleForFreeTrial}
                        />
                        <span>UPI</span>
                        {!isEligibleForFreeTrial && <span className="coming-soon-tag">Coming Soon</span>}
                      </label>
                      <label className={`method-option ${paymentMethod === 'netbanking' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="netbanking"
                          checked={paymentMethod === 'netbanking'}
                          onChange={() => setPaymentMethod('netbanking')}
                          disabled={!isEligibleForFreeTrial}
                        />
                        <span>Net Banking</span>
                        {!isEligibleForFreeTrial && <span className="coming-soon-tag">Coming Soon</span>}
                      </label>
                    </div>
                  </div>

                  {/* Payment Details Form */}
                  {paymentMethod === 'card' && (
                    <div className="card-details">
                      <div className="form-group">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={paymentDetails.cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          required
                          aria-label="Card number"
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="expiryDate">Expiry Date</label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={paymentDetails.expiryDate}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            maxLength="5"
                            required
                            aria-label="Card expiry date"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="cvv">CVV</label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={paymentDetails.cvv}
                            onChange={handlePaymentDetailsChange}
                            placeholder="123"
                            maxLength="4"
                            required
                            aria-label="Card CVV"
                          />
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="name">Name on Card</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={paymentDetails.name}
                          onChange={handlePaymentDetailsChange}
                          placeholder="John Doe"
                          required
                          aria-label="Name on card"
                        />
                      </div>
                    </div>
                  )}

                  {/* UPI Payment */}
                  {paymentMethod === 'upi' && (
                    <div className="upi-details">
                      <div className="form-group">
                        <label htmlFor="upiId">UPI ID</label>
                        <input
                          type="text"
                          id="upiId"
                          name="upiId"
                          value={paymentDetails.upiId}
                          onChange={handlePaymentDetailsChange}
                          placeholder="yourname@upi"
                          required
                          aria-label="UPI ID"
                        />
                      </div>
                      <p className="upi-instructions">
                        You will be redirected to your UPI app to complete the payment.
                      </p>
                    </div>
                  )}

                  {/* Net Banking */}
                  {paymentMethod === 'netbanking' && (
                    <div className="netbanking-details">
                      <div className="form-group">
                        <label htmlFor="bank">Select Bank</label>
                        <select 
                          id="bank" 
                          name="bank" 
                          value={paymentDetails.bank}
                          onChange={handlePaymentDetailsChange}
                          required
                          aria-label="Select bank"
                        >
                          <option value="">Select your bank</option>
                          <option value="sbi">State Bank of India</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                          <option value="kotak">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Total Amount */}
                  <div className="payment-summary">
                    <div className="summary-row">
                      <span>Event Fee:</span>
                      {isEligibleForFreeTrial ? (
                        <span className="free-amount">₹0 (Free Trial)</span>
                      ) : (
                        <span>₹100</span>
                      )}
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      {isEligibleForFreeTrial ? (
                        <span className="free-amount">₹0</span>
                      ) : (
                        <span>₹100</span>
                      )}
                    </div>
                  </div>

                  {/* Pay Now Button */}
                  <button 
                    type="submit" 
                    className="pay-now-btn"
                    disabled={processing || (!isEligibleForFreeTrial && paymentMethod !== 'free_trial')}
                  >
                    {processing ? 'Processing...' : 'Pay ₹100'}
                  </button>
                  
                  {/* Remove the coming soon note */}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;