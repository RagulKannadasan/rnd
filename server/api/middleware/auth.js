const { admin } = require('../config/firebase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    if (admin) {
      // If Firebase Admin is not initialized (local dev without service account), mock the auth
    if (admin.apps.length === 0) {
      console.warn('Firebase Admin not initialized, skipping token verification for local dev.');
      req.user = { uid: 'mock-user-123', phone: '+1234567890' };
      return next();
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } else {
      // If Firebase admin isn't configured, we bypass for testing purposes
      // WARNING: In production, this must not be allowed!
      console.warn('Firebase Admin not initialized. Bypassing auth verification for development.');
      req.user = { uid: 'unverified_dev_user' };
      next();
    }
  } catch (error) {
    console.error('Error verifying auth token', error);
    res.status(403).json({ error: 'Forbidden: Invalid token' });
  }
};

module.exports = authenticate;
