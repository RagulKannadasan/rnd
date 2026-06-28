const admin = require('firebase-admin');
const fs = require('fs');
require('dotenv').config();

let db = null;

try {
  // If the user provides a service account path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log('Firebase Admin initialized successfully.');
  } else {
    console.warn('Firebase Admin NOT initialized. Please set FIREBASE_SERVICE_ACCOUNT_PATH in .env to a valid service account JSON file.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

module.exports = { admin, db };
