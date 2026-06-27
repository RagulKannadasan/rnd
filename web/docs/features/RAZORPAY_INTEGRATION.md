# Razorpay Integration Guide

This document explains how to set up and use the Razorpay payment integration in the R&D Run and Develop application.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with your Razorpay keys:

```env
# Razorpay Keys - Replace with your actual keys from https://dashboard.razorpay.com/
# For Test Mode
RAZORPAY_KEY_ID_TEST=rzp_test_your_test_key_id_here
RAZORPAY_KEY_SECRET_TEST=your_test_key_secret_here

# For Live Mode
RAZORPAY_KEY_ID_LIVE=rzp_live_your_live_key_id_here
RAZORPAY_KEY_SECRET_LIVE=your_live_key_secret_here

# Active Mode (Set to "test" or "live")
RAZORPAY_MODE=test

# Server Configuration
PORT=5000
```

### 2. Install Dependencies

Make sure all required dependencies are installed:

```bash
npm install
```

### 3. Start the Backend Server

```bash
npm run server
```

The server will start on port 5000 (or the port specified in your .env file).

### 4. Start the Frontend

In a separate terminal:

```bash
npm start
```

## Switching Between Test and Live Modes

To switch between test and live modes:

1. Update the `RAZORPAY_MODE` variable in your `.env` file:
   - For testing: `RAZORPAY_MODE=test`
   - For production: `RAZORPAY_MODE=live`

2. Restart both the backend server and frontend application.

## How It Works

### Frontend (PaymentButton.jsx)

The PaymentButton component handles the frontend integration:

1. Dynamically loads the Razorpay Checkout.js script
2. Calls the backend API to create a payment order
3. Opens the Razorpay payment popup
4. Handles success and failure callbacks

### Backend (scripts/server.js)

The backend server handles secure operations:

1. Creates orders using the Razorpay API
2. Keeps secret keys secure on the server
3. Provides endpoints for order creation and payment verification

## Test Card Details

For testing in test mode, use these card details:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- Name: Any name
- Country: India

## Security Notes

1. Never expose your Razorpay secret keys in frontend code
2. Always create orders on the backend
3. Verify payments on the backend for critical operations
4. Use HTTPS in production

## Customization

You can customize the payment flow by modifying:

1. PaymentButton.jsx - UI and flow
2. server.js - Backend logic and verification
3. .env - Configuration settings

## Troubleshooting

1. **Razorpay SDK not loading**: Check your internet connection
2. **Order creation fails**: Verify your keys and network connection
3. **Payment not processing**: Check test mode vs live mode settings
4. **CORS issues**: Ensure your frontend URL is whitelisted