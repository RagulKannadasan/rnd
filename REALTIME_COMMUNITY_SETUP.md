# Real-time Community Feature Setup

This document explains how to set up and use the real-time community feature in the Run & Develop application.

## Overview

The real-time community feature uses Firebase Firestore to provide live updates for:
- Community posts feed
- Leaderboard rankings

## Implementation Details

### Firestore Collections

The feature uses two main collections:

1. **communityPosts** - Stores all community posts
2. **leaderboard** - Stores leaderboard data

### Real-time Listeners

The Community component uses Firestore's `onSnapshot` method to listen for real-time updates:

- Posts are ordered by creation date (newest first)
- Leaderboard is ordered by number of runs (descending)
- Both collections are limited to prevent performance issues

## Setup Instructions

### 1. Initialize Sample Data

To initialize the Firestore collections with sample data:

1. Make sure you're logged into Firebase CLI with the correct project
2. Run the initialization script:

```bash
cd Run-Development
node scripts/initCommunityData.js
```

### 2. Firestore Security Rules

Add the following rules to your Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules...
    
    // Community posts - authenticated users can read, creators can create/update
    match /communityPosts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Leaderboard - all authenticated users can read
    match /leaderboard/{leaderId} {
      allow read: if request.auth != null;
      allow create, update, delete: if false; // Only admins can modify
    }
  }
}
```

## Features

### Real-time Updates
- New posts appear immediately for all users
- Like counts update in real-time
- Leaderboard updates as user stats change

### User Interactions
- Create new posts with text and images
- Like posts (with user-specific like tracking)
- Comment on posts (UI placeholder)
- Share posts (UI placeholder)

## Data Structure

### Community Posts
```javascript
{
  userId: string,
  userName: string,
  userPhoto: string,
  userLevel: string,
  content: string,
  image: string (optional),
  likes: number,
  comments: number,
  shares: number,
  likedBy: { [userId]: boolean },
  createdAt: timestamp,
  timestamp: string
}
```

### Leaderboard Entries
```javascript
{
  name: string,
  runs: number,
  distance: number,
  level: string
}
```

## Testing Real-time Updates

1. Open the community page in two different browsers or browser tabs
2. Create a new post in one browser
3. Observe that the post immediately appears in the other browser
4. Like a post in one browser
5. Observe that the like count updates immediately in the other browser

## Troubleshooting

### Common Issues

1. **Posts not appearing**
   - Check Firestore security rules
   - Verify the user is authenticated
   - Check browser console for errors

2. **Real-time updates not working**
   - Ensure you're using the correct Firebase project
   - Check network connectivity
   - Verify Firestore listeners are properly set up

3. **Permission errors**
   - Review Firestore security rules
   - Ensure the user has proper authentication

### Debugging Tips

1. Use Firestore console to verify data is being written correctly
2. Check browser console for JavaScript errors
3. Use Firebase Emulator Suite for local testing