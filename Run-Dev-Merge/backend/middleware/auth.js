import { adminAuth, adminDb } from '../config/firebase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Try to verify as Firebase token first
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user'
      };
      return next();
    } catch (firebaseError) {
      // If Firebase token fails, try JWT token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};

export const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      // For hardcoded admin credentials, check against environment
      const adminUsername = 'admin01';
      const adminEmail = 'admin@rundev.com';
      
      if (req.user.email !== adminEmail && req.user.username !== adminUsername) {
        return res.status(403).json({
          success: false,
          message: 'Admin access required.'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Admin verification failed.',
      error: error.message
    });
  }
};

export const generateJWT = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '24h' 
  });
};