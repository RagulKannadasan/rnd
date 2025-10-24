import React, { useState } from 'react';
import { FaQrcode, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import { getCurrentUser, formatAmountForRazorpay, validatePaymentData } from '../../services/paymentService';
import { getApiUrl } from '../../services/apiConfig';
import './PaymentButton.css';

const QRPayment = ({ amount, eventName, eventId, onPaymentSuccess, onPaymentFailure }) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const generateQRPayment = async () => {
    // Validate payment data
    const validation = validatePaymentData({ amount, eventName, eventId });
    if (!validation.isValid) {
      // Use onPaymentFailure to handle this error which will show notification in parent
      if (onPaymentFailure) {
        onPaymentFailure(new Error(validation.error));
      }
      return;
    }

    // Get current user
    const user = getCurrentUser();
    const userId = user ? user.uid : 'anonymous';

    setLoading(true);
    setPaymentStatus(null);

    try {
      // Create order on backend
      const response = await fetch(getApiUrl('/api/create-qr-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formatAmountForRazorpay(amount),
          currency: 'INR',
          eventId,
          userId,
          eventName,
          customerName: user ? user.name : 'Customer',
          customerEmail: user ? user.email : '',
          customerPhone: user && user.phoneNumber ? user.phoneNumber.replace('+91', '') : ''
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const order = await response.json();

      if (!order.qrCode || !order.shortUrl) {
        throw new Error('QR code generation failed');
      }

      // Set QR data for display
      setQrData({
        shortUrl: order.shortUrl,
        qrCode: order.qrCode,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      });
      
      setShowQR(true);
      
      // Start polling for payment status
      pollPaymentStatus(order.id);
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Use onPaymentFailure to handle this error which will show notification in parent
      if (onPaymentFailure) {
        onPaymentFailure(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Poll for payment status
  const pollPaymentStatus = async (orderId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(getApiUrl(`/api/check-payment-status/${orderId}`));
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'paid') {
            clearInterval(pollInterval);
            setPaymentStatus('success');
            // Use onPaymentSuccess which will show notification in parent
            if (onPaymentSuccess) {
              onPaymentSuccess({ razorpay_order_id: orderId });
            }
          } else if (result.status === 'failed') {
            clearInterval(pollInterval);
            setPaymentStatus('failed');
            // Use onPaymentFailure to handle this error which will show notification in parent
            if (onPaymentFailure) {
              onPaymentFailure(new Error('Payment failed'));
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus !== 'success') {
        setPaymentStatus('timeout');
        // Use onPaymentFailure to handle timeout which will show notification in parent
        if (onPaymentFailure) {
          onPaymentFailure(new Error('Payment timeout. Please try again or use another payment method.'));
        }
      }
    }, 600000); // 10 minutes
  };

  const handleRetry = () => {
    setShowQR(false);
    setQrData(null);
    setPaymentStatus(null);
    generateQRPayment();
  };

  return (
    <div className="qr-payment-container">
      {!showQR ? (
        <button 
          className="payment-button enhanced qr-payment-button" 
          onClick={generateQRPayment}
          disabled={loading}
        >
          {loading ? (
            <div className="button-content">
              <FaSpinner className="spinner-icon" />
              <span>Generating QR Code...</span>
            </div>
          ) : (
            <div className="button-content">
              <FaQrcode className="qr-icon" />
              <span>Pay with QR Code</span>
            </div>
          )}
        </button>
      ) : (
        <div className="qr-display-section">
          <h3>Scan QR Code to Pay ₹{amount}</h3>
          <div className="qr-code-container">
            <QRCodeCanvas 
              value={qrData.shortUrl} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="qr-instructions">
            <p>
              <FaInfoCircle /> Scan this QR code with any UPI app to complete your payment
            </p>
            <p>Amount: ₹{amount}</p>
            <p>Event: {eventName}</p>
          </div>
          
          {paymentStatus === 'success' && (
            <div className="payment-status success">
              <p>Payment Successful!</p>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="payment-status failed">
              <p>Payment Failed</p>
              <button onClick={handleRetry} className="retry-button">
                Retry Payment
              </button>
            </div>
          )}
          
          {paymentStatus === 'timeout' && (
            <div className="payment-status timeout">
              <p>Payment Timeout</p>
              <button onClick={handleRetry} className="retry-button">
                Retry Payment
              </button>
            </div>
          )}
          
          {!paymentStatus && (
            <div className="payment-status pending">
              <FaSpinner className="spinner-icon" />
              <p>Waiting for payment confirmation...</p>
              <p className="small">This may take a few moments</p>
            </div>
          )}
          
          <div className="qr-actions">
            <button 
              onClick={() => setShowQR(false)} 
              className="secondary-button"
            >
              Back to Payment Methods
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRPayment;