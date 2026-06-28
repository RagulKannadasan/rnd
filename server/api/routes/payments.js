const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/firebase');
require('dotenv').config();

// Create Razorpay instance
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Route to create a Razorpay order
router.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  if (!razorpay) {
    return res.status(500).json({ error: 'Razorpay keys are not configured on the server.' });
  }

  try {
    const options = {
      amount: parseInt(amount) * 100, // Razorpay works in paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Route to verify Razorpay payment and write to Firebase
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Razorpay secret not configured.' });
  }

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Signature is valid. Add the booking to Firestore if configured.
      if (db) {
        bookingData.paymentId = razorpay_payment_id;
        bookingData.orderId = razorpay_order_id;
        bookingData.status = 'confirmed';
        bookingData.bookingDate = new Date().toISOString(); // Firestore serverTimestamp not available here without admin sdk field values
        bookingData.createdAt = new Date().toISOString();

        await db.collection('bookings').add(bookingData);
      } else {
        console.warn('Payment verified but Firebase DB is not configured to save the booking.');
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
