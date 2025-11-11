# QR Code Payment Integration

This document explains how to use and test the QR code payment functionality integrated with Razorpay.

## Overview

The QR code payment feature allows users to make payments by scanning a QR code with their UPI-enabled mobile app. This provides an alternative payment method to the standard card payment flow.

## Components

1. **QRPayment.jsx** - React component that handles QR code generation and payment status checking
2. **Backend API endpoints** - Server-side routes for creating QR codes and checking payment status

## How It Works

1. User selects QR code payment option
2. Frontend sends request to backend to create a QR code
3. Backend uses Razorpay API to generate a UPI QR code
4. Frontend displays the QR code to the user
5. User scans the QR code with their UPI app and completes payment
6. Frontend polls the backend to check payment status
7. When payment is confirmed, user is notified and redirected

## API Endpoints

### Create QR Code Order
```
POST /api/create-qr-order
```

**Request Body:**
```json
{
  "amount": 10000, // Amount in paise (₹100)
  "currency": "INR",
  "eventId": "event_123",
  "userId": "user_123",
  "eventName": "Test Event",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9999999999"
}
```

**Response:**
```json
{
  "id": "qr_code_id",
  "qrCode": "base64_encoded_qr_code",
  "shortUrl": "https://rzp.io/i/abc123",
  "amount": 10000,
  "currency": "INR",
  "status": "active"
}
```

### Check Payment Status
```
GET /api/check-payment-status/:orderId
```

**Response:**
```json
{
  "status": "paid", // or "pending", "failed"
  "paymentId": "pay_123",
  "orderId": "order_123"
}
```

## Testing

1. Start the backend server:
   ```bash
   npm run server
   ```

2. Start the frontend:
   ```bash
   npm start
   ```

3. Navigate to the test page:
   ```
   http://localhost:3000/plans-test
   ```

4. Select "QR Code Payment" option
5. Scan the generated QR code with a UPI app
6. Complete the payment
7. Observe the payment confirmation

## Error Handling

The component handles various error scenarios:
- Network errors
- Invalid payment data
- QR code generation failures
- Payment timeouts (10-minute limit)
- Payment failures

## Security

1. All sensitive operations are handled server-side
2. Payment verification is performed automatically
3. User data is properly sanitized
4. Polling is limited to prevent excessive API calls