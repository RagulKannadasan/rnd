// Utility functions for payment processing
import { auth } from '../firebase';

/**
 * Get current user ID for payment processing
 * @returns {string|null} User ID or null if not authenticated
 */
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

/**
 * Get current user information for payment processing
 * @returns {Object|null} User information or null if not authenticated
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    name: user.displayName || 'User',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    photoURL: user.photoURL || null,
  };
};

/**
 * Format amount for Razorpay (convert to paise)
 * @param {number} amount - Amount in rupees
 * @returns {number} Amount in paise
 */
export const formatAmountForRazorpay = (amount) => {
  return Math.round(amount * 100);
};

/**
 * Validate payment data before processing
 * @param {Object} data - Payment data
 * @returns {Object} Validation result
 */
export const validatePaymentData = (data) => {
  const { amount, eventName, eventId } = data;
  
  if (!amount || amount <= 0) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (!eventName || eventName.trim() === '') {
    return { isValid: false, error: 'Event name is required' };
  }
  
  if (!eventId || eventId.trim() === '') {
    return { isValid: false, error: 'Event ID is required' };
  }
  
  return { isValid: true };
};

/**
 * Create payment description
 * @param {string} eventName - Name of the event
 * @param {string} userId - User ID
 * @returns {string} Payment description
 */
export const createPaymentDescription = (eventName, userId) => {
  return `Payment for ${eventName} by user ${userId || 'anonymous'}`;
};

const paymentService = {
  getCurrentUserId,
  getCurrentUser,
  formatAmountForRazorpay,
  validatePaymentData,
  createPaymentDescription
};

export default paymentService;
