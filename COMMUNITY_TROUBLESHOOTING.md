# Community Features Troubleshooting Guide

This document provides solutions for common issues with the real-time community features.

## Common Errors and Solutions

### 1. "post.likedBy.includes is not a function" Error

**Problem**: This error occurs when the `likedBy` field in community posts is not an array.

**Cause**: 
- Posts were created before the proper array structure was implemented
- Database migration issues
- Incorrect data types in Firestore

**Solution**:
1. Run the fix script to correct the data structure:
   ```bash
   npm run fix-community-posts
   ```

2. The script will:
   - Convert `likedBy` objects to arrays
   - Initialize missing `likedBy` fields as empty arrays
   - Ensure all posts have the correct data structure

**Prevention**:
- Always initialize `likedBy` as an empty array when creating new posts
- Use proper Firestore array operations (arrayUnion, arrayRemove)

### 2. Comments Not Appearing in Real-time

**Problem**: New comments don't appear instantly for all users.

**Checklist**:
- [ ] Verify the comment is being added to the correct subcollection
- [ ] Check Firestore security rules for comment permissions
- [ ] Ensure the post ID is correct in the subcollection path
- [ ] Verify the real-time listener is properly set up

**Solution**:
1. Check the comment subcollection structure:
   ```
   communityPosts/{postId}/comments/{commentId}
   ```

2. Verify Firestore security rules allow read/write access:
   ```javascript
   match /communityPosts/{postId}/comments/{commentId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null;
     allow update, delete: if request.auth != null && 
       request.auth.uid == resource.data.userId;
   }
   ```

3. Check the real-time listener in the component:
   ```javascript
   const commentsQuery = query(
     collection(db, 'communityPosts', postId, 'comments'),
     orderBy('createdAt', 'asc'),
     limit(50)
   );
   ```

### 3. Likes Not Working Properly

**Problem**: Likes don't increment/decrement correctly or users can like multiple times.

**Checklist**:
- [ ] Verify `likedBy` is always an array
- [ ] Check arrayUnion/arrayRemove usage
- [ ] Ensure user authentication
- [ ] Verify Firestore permissions

**Solution**:
1. Always check if `likedBy` is an array before using array methods:
   ```javascript
   const isPostLikedByUser = (post, userId) => {
     if (!post.likedBy || !Array.isArray(post.likedBy)) {
       return false;
     }
     return post.likedBy.includes(userId);
   };
   ```

2. Use proper Firestore array operations:
   ```javascript
   // Like a post
   await updateDoc(postRef, {
     likes: increment(1),
     likedBy: arrayUnion(currentUser.uid)
   });

   // Unlike a post
   await updateDoc(postRef, {
     likes: increment(-1),
     likedBy: arrayRemove(currentUser.uid)
   });
   ```

### 4. Shares Not Counting

**Problem**: Share count doesn't increment when users share posts.

**Checklist**:
- [ ] Verify increment operation
- [ ] Check user authentication
- [ ] Ensure proper error handling

**Solution**:
1. Use increment for share counting:
   ```javascript
   await updateDoc(postRef, {
     shares: increment(1)
   });
   ```

2. Add proper error handling:
   ```javascript
   try {
     // Update post's share count
     const postRef = doc(db, 'communityPosts', postId);
     await updateDoc(postRef, {
       shares: increment(1)
     });
   } catch (error) {
     console.error('Error sharing post:', error);
   }
   ```

## Database Structure Verification

### Community Posts Collection
```
communityPosts/
  {postId}/
    userId: string
    userName: string
    userPhoto: string
    content: string
    image: string (optional)
    likes: number
    comments: number
    shares: number
    likedBy: array of user IDs
    createdAt: timestamp
    timestamp: string
```

### Comments Subcollection
```
communityPosts/
  {postId}/
    comments/
      {commentId}/
        userId: string
        userName: string
        userPhoto: string
        content: string
        createdAt: timestamp
```

## Testing Real-time Features

### 1. Post Creation
1. Open the community page in two browser windows
2. Create a post in one window
3. Verify it appears instantly in the other window

### 2. Commenting
1. Expand comments on a post
2. Add a comment
3. Verify it appears instantly for all users
4. Check timestamp formatting

### 3. Liking
1. Like a post
2. Verify the counter increments
3. Verify the like button changes appearance
4. Unlike the post and verify the counter decrements

### 4. Sharing
1. Click the share button
2. Verify the counter increments
3. Verify user feedback is shown

## Performance Optimization

### 1. Pagination
- Limit posts to 20 most recent
- Limit comments to 50 per post
- Load comments only when expanded

### 2. Data Validation
- Always check data types before operations
- Initialize arrays and objects properly
- Handle null/undefined values gracefully

### 3. Error Handling
- Wrap Firestore operations in try/catch blocks
- Provide user feedback for errors
- Log errors for debugging

## Security Considerations

### 1. Authentication
- Verify user is authenticated before allowing interactions
- Check user ID matches document owner for updates/deletes

### 2. Data Validation
- Validate input data before storing
- Sanitize user-generated content
- Limit document sizes

### 3. Rate Limiting
- Consider implementing rate limiting for:
  - Post creation
  - Comment submission
  - Like operations

## Debugging Tools

### 1. Browser Console
- Check for JavaScript errors
- Monitor network requests
- Verify Firestore operations

### 2. Firestore Console
- Check document structures
- Verify security rules
- Monitor usage statistics

### 3. React DevTools
- Inspect component state
- Monitor re-renders
- Check props passing

## Running Maintenance Scripts

### Fix Community Posts
```bash
npm run fix-community-posts
```
This script corrects any posts with incorrect `likedBy` structures.

### Initialize Community Data
```bash
npm run init-community-data
```
This script adds sample data for testing.

## Contact Support

If you continue to experience issues after following this guide:

1. Check the browser console for specific error messages
2. Verify your Firebase configuration
3. Ensure all dependencies are up to date
4. Contact the development team with:
   - Error messages
   - Steps to reproduce
   - Browser/environment information