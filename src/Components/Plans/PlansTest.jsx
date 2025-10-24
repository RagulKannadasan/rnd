import React from 'react';
import { FaCreditCard, FaQrcode } from 'react-icons/fa';
import PaymentButton from '../Payments/PaymentButton';
import QRPayment from '../Payments/QRPayment';
import './Plans.css';

const PlansTest = () => {
  const handlePaymentSuccess = (response) => {
    console.log('Payment successful:', response);
    alert('Payment successful! Redirecting to dashboard...');
  };

  const handlePaymentFailure = (error) => {
    console.log('Payment failed:', error);
    alert('Payment failed. Please try again.');
  };

  return (
    <div className="plans-container">
      <div className="plans-content">
        <div className="plans-header">
          <h2 className="main-title">
            <span className="highlight-text">Razorpay Integration Test</span>
          </h2>
          <p className="subtitle">Test the payment functionality with Razorpay</p>
        </div>

        <div className="plans-grid">
          <div className="plan-card">
            <div className="plan-header">
              <div className="plan-icon" style={{color: '#F15A24'}}>
                <span>💳</span>
              </div>
              <div className="plan-title">
                <h3 className="plan-name">Test Payment</h3>
                <p className="plan-subtitle">Razorpay Integration</p>
              </div>
            </div>
            
            <div className="price-section">
              <div className="current-price-wrapper">
                <span className="current-price">₹100</span>
              </div>
            </div>
            
            <div className="payment-methods-test">
              <h4>Test Payment Methods</h4>
              
              {/* Credit Card Payment */}
              <div className="payment-method-card">
                <div className="method-icon">
                  <FaCreditCard />
                </div>
                <span className="method-name">Credit/Debit Card</span>
                <PaymentButton
                  amount={100}
                  eventName="Test Payment"
                  eventId="test_payment_123"
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={handlePaymentFailure}
                />
              </div>
              
              {/* QR Code Payment */}
              <div className="payment-method-card">
                <div className="method-icon">
                  <FaQrcode />
                </div>
                <span className="method-name">QR Code Payment</span>
                <QRPayment
                  amount={100}
                  eventName="Test Payment"
                  eventId="test_payment_123"
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFailure={handlePaymentFailure}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansTest;