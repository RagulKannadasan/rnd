import React from 'react';
import Mention from './Mention';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Parse text and extract mentions
 * @param {string} text - The text to parse
 * @param {Array} users - Array of user objects with id and displayName properties
 * @returns {Array} - Array of mention objects with userId and username
 */
export const extractMentions = (text, users) => {
  // Handle case where users is undefined or not an array
  if (!text || !users || !Array.isArray(users)) return [];
  
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const user = users.find(u => u.displayName === username);
    if (user) {
      mentions.push({
        userId: user.id,
        username: username
      });
    }
  }
  
  return mentions;
};

/**
 * Parse text and replace mentions with Mention components
 * @param {string} text - The text to parse
 * @param {Array} users - Array of user objects with id and displayName properties
 * @returns {Array} - Array of text segments and Mention components
 */
export const parseMentions = (text, users) => {
  // Handle case where users is undefined or not an array
  if (!text || !users || !Array.isArray(users)) return text || '';
  
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const user = users.find(u => u.displayName === username);
    
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add the mention component
    if (user) {
      parts.push(<Mention key={`${username}-${match.index}`} username={username} />);
    } else {
      // If user not found, just render the text as is
      parts.push(match[0]);
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
};

/**
 * Convert mentions to user IDs for storage
 * @param {string} text - The text to process
 * @param {Array} users - Array of user objects with id and displayName properties
 * @returns {Object} - Object containing processed text and mention user IDs
 */
export const processMentionsForStorage = (text, users) => {
  // Handle case where users is undefined or not an array
  if (!text || !users || !Array.isArray(users)) {
    return {
      processedText: text,
      mentionUserIds: []
    };
  }
  
  const mentions = extractMentions(text, users);
  const mentionUserIds = [...new Set(mentions.map(m => m.userId))]; // Remove duplicates
  
  return {
    processedText: text,
    mentionUserIds
  };
};

/**
 * Send notifications to mentioned users
 * @param {string} text - The text containing mentions
 * @param {Array} users - Array of user objects with id and displayName properties
 * @param {Object} currentUser - The current user object
 * @param {string} type - Type of mention (post or comment)
 * @param {string} postId - ID of the post
 * @param {string} commentId - ID of the comment (optional)
 */
export const sendMentionNotifications = async (text, users, currentUser, type, postId, commentId = null) => {
  // Handle case where users is undefined or not an array
  if (!text || !users || !Array.isArray(users) || !currentUser) {
    console.log('Skipping mention notifications due to missing parameters');
    return;
  }
  
  try {
    const mentions = extractMentions(text, users);
    console.log('Mentions found:', mentions);
    
    // Send notification to each mentioned user (except the current user)
    for (const mention of mentions) {
      // Don't send notification to the user who created the mention
      if (mention.userId === currentUser.uid) {
        console.log('Skipping notification for self-mention');
        continue;
      }
      
      const mentionedUser = users.find(u => u.id === mention.userId);
      if (!mentionedUser) {
        console.log('Mentioned user not found:', mention.userId);
        continue;
      }
      
      // Create notification message
      let message = '';
      let title = '';
      
      if (type === 'post') {
        title = 'You were mentioned in a post';
        message = `${currentUser.displayName || 'Someone'} mentioned you in their post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
      } else if (type === 'comment') {
        title = 'You were mentioned in a comment';
        message = `${currentUser.displayName || 'Someone'} mentioned you in a comment: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
      }
      
      console.log('Creating notification for user:', mention.userId, 'with title:', title);
      
      // Create notification in Firestore
      const notificationRef = await addDoc(collection(db, 'notifications'), {
        userId: mention.userId,
        title: title,
        message: message,
        type: 'mention',
        postId: postId,
        commentId: commentId,
        read: false,
        createdAt: serverTimestamp()
      });
      
      console.log('Notification created with ID:', notificationRef.id);
    }
  } catch (error) {
    console.error('Error sending mention notifications:', error);
  }
};