# Razorpay Integration Testing Guide

This document explains how to test the Razorpay integration in the R&D Run and Develop application.

## Prerequisites

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env`:
   ```env
   RAZORPAY_KEY_ID_TEST=rzp_test_your_test_key_id_here
   RAZORPAY_KEY_SECRET_TEST=your_test_key_secret_here
   RAZORPAY_MODE=test
   ```

## Testing the Integration

### 1. Start the Backend Server

```bash
npm run server
```

The server will start on port 5000 by default.

### 2. Start the Frontend Application

In a separate terminal:

```bash
npm start
```

### 3. Navigate to the Test Page

Open your browser and go to:
```
http://localhost:3000/plans-test
```

### 4. Test the Payment Flow

1. Click the "Pay ₹100" button on the test page
2. The Razorpay payment modal should appear
3. Use test card details:
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: 123
   - Name: Any name
4. Complete the payment
5. Check the browser console for success messages

## Testing in the Plans Page

1. Navigate to the main application:
   ```
   http://localhost:3000
   ```

2. Scroll to the Plans section or click on the Membership link in the navigation

3. Click on "Choose Pay-Per-Run" or "Choose Monthly Membership" (not the free trial)

4. The payment modal should appear with the Razorpay option

5. Click on the Credit/Debit Card option to initiate the payment

## Test Card Details

For testing in test mode, use these card details:

- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: 123
- Name: Any name
- Country: India

## Troubleshooting

### Common Issues

1. **Razorpay SDK not loading**:
   - Check your internet connection
   - Verify the script URL: https://checkout.razorpay.com/v1/checkout.js

2. **Order creation fails**:
   - Verify your test keys in the `.env` file
   - Check the backend server logs
   - Ensure the backend server is running

3. **Payment not processing**:
   - Make sure you're using test mode
   - Verify test card details
   - Check browser console for errors

4. **CORS issues**:
   - Ensure your frontend URL is allowed in the backend CORS configuration

### Debugging Tips

1. Check the browser console for JavaScript errors
2. Check the backend server logs for API errors
3. Verify environment variables are correctly set
4. Ensure all required dependencies are installed

## Code Structure

The integration consists of:

1. **Frontend Components**:
   - `src/Components/Payments/PaymentButton.jsx` - Main payment component
   - `src/Components/Plans/Plans.jsx` - Updated plans page with payment integration
   - `src/Components/Plans/PlansTest.jsx` - Test page for payment integration

2. **Backend Server**:
   - `scripts/server.js` - Express server handling Razorpay orders

3. **Utility Functions**:
   - `src/services/paymentService.js` - Helper functions for payment processing

4. **Styling**:
   - `src/Components/Payments/PaymentButton.css` - Payment button styles
   - `src/Components/Plans/Plans.css` - Updated plans page styles

## Security Notes

1. Secret keys are kept on the backend only
2. Orders are created securely on the server
3. Payment verification is available for critical operations
4. User data is properly handled and not exposed