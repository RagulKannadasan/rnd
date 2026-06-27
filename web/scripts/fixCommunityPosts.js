import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

import dotenv from 'dotenv';
dotenv.config();

// Firebase configuration (same as in your firebase.js)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to fix community posts with incorrect likedBy structure
async function fixCommunityPosts() {
  try {
    console.log("Starting to fix community posts...");
    
    // Get all community posts
    const postsCollection = collection(db, 'communityPosts');
    const postsSnapshot = await getDocs(postsCollection);
    
    let fixedCount = 0;
    
    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data();
      
      // Check if likedBy is not an array
      if (postData.likedBy && !Array.isArray(postData.likedBy)) {
        console.log(`Fixing post ${postDoc.id}: converting likedBy to array`);
        
        // Convert likedBy to array
        let likedByArray = [];
        if (typeof postData.likedBy === 'object') {
          // If it's an object, extract the keys (user IDs)
          likedByArray = Object.keys(postData.likedBy);
        } else {
          // If it's a primitive value, create an array with that value
          likedByArray = [postData.likedBy];
        }
        
        // Update the document
        await updateDoc(doc(db, 'communityPosts', postDoc.id), {
          likedBy: likedByArray
        });
        
        fixedCount++;
      } else if (!postData.likedBy) {
        // If likedBy doesn't exist, initialize it as an empty array
        console.log(`Fixing post ${postDoc.id}: initializing likedBy as empty array`);
        await updateDoc(doc(db, 'communityPosts', postDoc.id), {
          likedBy: []
        });
        fixedCount++;
      }
    }
    
    console.log(`Fixed ${fixedCount} posts with incorrect likedBy structure`);
    console.log("Community posts fix completed successfully!");
  } catch (error) {
    console.error("Error fixing community posts:", error);
  }
}

// Run the fix function
if (typeof window === 'undefined') {
  fixCommunityPosts();
}

export { fixCommunityPosts };