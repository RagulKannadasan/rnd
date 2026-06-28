const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authenticate = require('../middleware/auth');

// Get all posts
router.get('/posts', authenticate, async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('communityPosts').orderBy('createdAt', 'desc').get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a post
router.post('/posts', authenticate, async (req, res) => {
  const { content, authorName, authorPhoto } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    const newPost = {
      content,
      authorId: req.user.uid,
      authorName: authorName || 'Runner',
      authorPhoto: authorPhoto || 'https://via.placeholder.com/40',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    const docRef = await db.collection('communityPosts').add(newPost);
    res.json({ id: docRef.id, ...newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Toggle Like on a post
router.post('/posts/:id/like', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    const { isLiked } = req.body;
    const postRef = db.collection('communityPosts').doc(req.params.id);
    
    // In admin SDK, we don't have arrayUnion/increment exactly the same, but we can do a transaction
    // Or we can use Firebase Admin's FieldValue
    const admin = require('firebase-admin');
    
    await postRef.update(isLiked
      ? { likes: admin.firestore.FieldValue.increment(-1), likedBy: admin.firestore.FieldValue.arrayRemove(req.user.uid) }
      : { likes: admin.firestore.FieldValue.increment(1), likedBy: admin.firestore.FieldValue.arrayUnion(req.user.uid) }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Delete a post
router.delete('/posts/:id', authenticate, async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: 'DB not configured' });
    const postRef = db.collection('communityPosts').doc(req.params.id);
    const post = await postRef.get();
    
    if (!post.exists) return res.status(404).json({ error: 'Not found' });
    if (post.data().authorId !== req.user.uid) return res.status(403).json({ error: 'Forbidden' });
    
    await postRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Get leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('users').orderBy('totalDistance', 'desc').limit(10).get();
    const leaders = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().displayName || 'Runner',
      distance: doc.data().totalDistance || 0,
      points: doc.data().points || 0
    }));
    res.json(leaders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
