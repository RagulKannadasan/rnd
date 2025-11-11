# Payment Components

This directory contains all payment-related components for the R&D Run and Develop application.

## Components

1. **PaymentButton.jsx** - Main payment component that integrates with Razorpay
2. **Payments.jsx** - Existing payment flow (free trial only)
3. **PaymentExample.jsx** - Example implementation showing how to use PaymentButton

## Integration Guide

### Frontend Integration

1. Import the PaymentButton component:
```jsx
import PaymentButton from './PaymentButton';
```

2. Use it in your component:
```jsx
<PaymentButton
  amount={100}
  eventName="Weekly Community Run"
  eventId="event_001"
  userId="user_123"
  onPaymentSuccess={handlePaymentSuccess}
  onPaymentFailure={handlePaymentFailure}
/>
```

### Backend Integration

The backend server (`scripts/server.js`) handles secure operations:

1. Order creation via Razorpay API
2. Payment verification
3. Mode switching (test/live)

Start the server with:
```bash
npm run server
```

## Environment Variables

Create a `.env` file with your Razorpay keys:

```env
RAZORPAY_KEY_ID_TEST=your_test_key_id
RAZORPAY_KEY_SECRET_TEST=your_test_key_secret
RAZORPAY_KEY_ID_LIVE=your_live_key_id
RAZORPAY_KEY_SECRET_LIVE=your_live_key_secret
RAZORPAY_MODE=test
```

## Test Mode vs Live Mode

- **Test Mode**: Uses test keys and endpoints (safe for development)
- **Live Mode**: Uses live keys and endpoints (real transactions)

Switch between modes by changing `RAZORPAY_MODE` in your `.env` file.

## Security

1. Secret keys are kept on the backend only
2. Orders are created server-side
3. Payment verification is available for critical operations