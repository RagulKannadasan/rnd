# Real-time Community Features Implementation

This document explains the implementation of real-time features in the Community page, including posts, comments, likes, and shares.

## Overview

The Community page now features full real-time functionality for all user interactions:
- Real-time post creation and display
- Real-time comments with instant updates
- Real-time likes with user-specific tracking
- Real-time share counting
- Real-time user ranking based on running statistics

## Technical Implementation

### 1. Real-time Posts

Posts are stored in the `communityPosts` collection in Firestore with the following structure:

```javascript
{
  userId: string,
  userName: string,
  userPhoto: string,
  userLevel: string,
  content: string,
  image: string (optional, URL to uploaded image),
  likes: number,
  comments: number,
  shares: number,
  likedBy: array of user IDs,
  createdAt: Firestore timestamp,
  timestamp: string
}
```

Real-time listener:
```javascript
const postsQuery = query(
  collection(db, 'communityPosts'),
  orderBy('createdAt', 'desc'),
  limit(20)
);

const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
  // Update posts state with new data
});
```

### 2. Real-time Comments

Comments are stored in a subcollection `comments` under each post document:

```javascript
// Collection structure: communityPosts/{postId}/comments/{commentId}
{
  userId: string,
  userName: string,
  userPhoto: string,
  content: string,
  createdAt: Firestore timestamp
}
```

Real-time listener for comments (activated when user expands comments):
```javascript
const commentsQuery = query(
  collection(db, 'communityPosts', postId, 'comments'),
  orderBy('createdAt', 'asc'),
  limit(50)
);

const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
  // Update comments state for specific post
});
```

### 3. Real-time Likes

Likes are tracked using two mechanisms:
1. A `likes` counter field in the post document
2. A `likedBy` array containing user IDs who liked the post

When a user likes a post:
```javascript
await updateDoc(postRef, {
  likes: increment(1),
  likedBy: arrayUnion(currentUser.uid)
});
```

When a user unlikes a post:
```javascript
await updateDoc(postRef, {
  likes: increment(-1),
  likedBy: arrayRemove(currentUser.uid)
});
```

### 4. Real-time Shares

Shares are tracked with a simple counter:
```javascript
await updateDoc(postRef, {
  shares: increment(1)
});
```

### 5. Real-time User Ranking

Users are ranked based on their running statistics:
1. Total distance run (descending)
2. Total runs (descending as tiebreaker)

The ranking is calculated by:
1. Listening to the `users` collection
2. For each user, querying their bookings to calculate stats
3. Sorting users based on calculated stats

## Features

### Post Creation
- Text posts with optional image uploads
- Images are uploaded to Firebase Storage
- Real-time display for all users

### Commenting System
- Nested comments under posts
- Real-time display of new comments
- Timestamp formatting (e.g., "5m ago", "2h ago")
- Enter key submission support

### Like System
- User-specific like tracking (can't like twice)
- Real-time counter updates
- Visual indication of user's like status

### Share System
- Share counting
- Alert notification for sharing

### User Ranking
- Real-time ranking based on running stats
- Display of distance and run count
- Visual ranking indicators

## Data Structure

### Firestore Collections

1. **communityPosts** - Main posts collection
2. **communityPosts/{postId}/comments** - Comments subcollection
3. **users** - User profiles
4. **bookings** - User running activities
5. **storage** - Image uploads

### Security Rules

Recommended Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Community posts
    match /communityPosts/{postId} {
      // Anyone can read posts
      allow read: if request.auth != null;
      
      // Only authenticated users can create posts
      allow create: if request.auth != null;
      
      // Only post owners can update/delete
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          request.auth.uid == resource.data.userId;
      }
    }
    
    // Users can read all user profiles for ranking
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

## Performance Considerations

1. **Pagination**: Posts are limited to 20 most recent
2. **Comment Loading**: Comments are only loaded when expanded
3. **Batch Updates**: Like operations use atomic increments
4. **Indexing**: Proper Firestore indexes for queries

## Testing Real-time Features

1. Open the community page in multiple browser windows
2. Create a post in one window
3. Verify it appears instantly in other windows
4. Add comments and verify real-time updates
5. Like posts and verify counters update instantly
6. Check user ranking updates when users complete runs

## Troubleshooting

### Common Issues

1. **Posts not appearing**
   - Check Firestore security rules
   - Verify user authentication
   - Check browser console for errors

2. **Comments not loading**
   - Ensure post ID is correct
   - Check subcollection permissions
   - Verify comment expansion state

3. **Likes not working**
   - Check arrayUnion/arrayRemove usage
   - Verify user authentication
   - Check likedBy field structure

### Debugging Tips

1. Use Firestore console to verify data structure
2. Check browser console for JavaScript errors
3. Use React DevTools to inspect component state
4. Monitor Firestore usage in Firebase console