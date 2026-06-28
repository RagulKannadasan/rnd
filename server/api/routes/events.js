const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// Note: For events, the app uses hardcoded arrays currently (in `events.tsx`), 
// but we will expose a unified endpoint that could pull from DB.
// If DB has no events, we will return the hardcoded fallback data.

const dummyUpcoming = [
  { id: '1', title: 'City Marathon 2026', date: '2026-08-15', location: 'Downtown', time: '06:00 AM', distance: '42.2K', participants: 1200, category: 'Marathon' },
  { id: '2', title: 'Summer Night Run', date: '2026-07-20', location: 'Marina Beach', time: '08:00 PM', distance: '10K', participants: 450, category: 'Fun Run' }
];

const dummyPast = [
  { id: '3', title: 'Spring Half Marathon', date: '2026-04-10', location: 'City Park', time: '05:30 AM', distance: '21.1K', participants: 800, category: 'Half Marathon' }
];

router.get('/upcoming', authenticate, async (req, res) => {
  try {
    if (!db) return res.json(dummyUpcoming);
    
    const snapshot = await db.collection('events').where('status', '==', 'upcoming').get();
    if (snapshot.empty) return res.json(dummyUpcoming);
    
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error(error);
    res.json(dummyUpcoming); // Fallback to dummy data
  }
});

router.get('/past', authenticate, async (req, res) => {
  try {
    if (!db) return res.json(dummyPast);
    
    const snapshot = await db.collection('events').where('status', '==', 'past').get();
    if (snapshot.empty) return res.json(dummyPast);
    
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    console.error(error);
    res.json(dummyPast);
  }
});

module.exports = router;
