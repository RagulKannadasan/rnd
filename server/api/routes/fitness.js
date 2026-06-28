const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// GET Workouts
router.get('/workouts', authenticate, async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('userWorkouts')
      .where('userId', '==', req.user.uid)
      .get();
    
    const workouts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort manually as we don't know if composite index exists
    workouts.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json(workouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// POST Workout
router.post('/workouts', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    const workoutData = {
      ...req.body,
      userId: req.user.uid,
      loggedAt: new Date().toISOString()
    };
    const docRef = await db.collection('userWorkouts').add(workoutData);
    res.json({ id: docRef.id, ...workoutData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

// DELETE Workout
router.delete('/workouts/:id', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    await db.collection('userWorkouts').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// GET Meals
router.get('/meals', authenticate, async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('userMeals')
      .where('userId', '==', req.user.uid)
      .get();
    
    const meals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    meals.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// POST Meal
router.post('/meals', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    const mealData = {
      ...req.body,
      userId: req.user.uid,
      loggedAt: new Date().toISOString()
    };
    const docRef = await db.collection('userMeals').add(mealData);
    res.json({ id: docRef.id, ...mealData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log meal' });
  }
});

// DELETE Meal
router.delete('/meals/:id', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    await db.collection('userMeals').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

module.exports = router;
