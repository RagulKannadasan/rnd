import React from 'react';
import PaymentButton from './PaymentButton';

const PaymentExample = () => {
  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    // Handle successful payment (e.g., update UI, send data to backend)
    alert('Payment successful! Redirecting to dashboard...');
    // You can redirect user to dashboard or show a success message
  };

  const handlePaymentFailure = (error) => {
    console.log('Payment failed:', error);
    // Handle payment failure (e.g., show error message)
    alert('Payment failed. Please try again.');
  };

  return (
    <div className="payment-example">
      <h2>Event Registration</h2>
      <p>Register for our upcoming running event</p>
      
      <div className="event-details">
        <h3>Weekly Community Run</h3>
        <p>Date: October 15, 2025</p>
        <p>Time: 7:00 AM</p>
        <p>Location: C3 Cafe, City Park</p>
        <p>Fee: ₹100</p>
      </div>

      <PaymentButton
        amount={100}
        eventName="Weekly Community Run"
        eventId="event_001"
        userId="user_123"
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />
    </div>
  );
};

export default PaymentExample;