const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// Get User Profile & Dashboard Stats
router.get('/profile', authenticate, async (req, res) => {
  try {
    if (!db) {
      return res.json({
        profile: { displayName: 'Runner (Mock)' },
        stats: { totalDistance: 0, totalWorkouts: 0, currentStreak: 0 }
      });
    }

    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const profile = userDoc.exists ? userDoc.data() : {};

    // Calculate dynamic stats from workouts
    const workoutsSnap = await db.collection('userWorkouts').where('userId', '==', req.user.uid).get();
    let totalDistance = 0;
    let totalWorkouts = workoutsSnap.size;
    
    workoutsSnap.forEach(doc => {
      const data = doc.data();
      if (data.distance) {
        totalDistance += parseFloat(data.distance);
      }
    });

    res.json({
      profile,
      stats: {
        totalDistance: totalDistance.toFixed(1),
        totalWorkouts,
        currentStreak: profile.currentStreak || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// Update Profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    
    const updateData = req.body;
    await db.collection('users').doc(req.user.uid).set(updateData, { merge: true });
    
    res.json({ success: true, updated: updateData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get User Bookings
router.get('/bookings', authenticate, async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snap = await db.collection('bookings')
      .where('userId', '==', req.user.uid)
      .get();
      
    const bookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
