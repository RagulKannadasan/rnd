import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// Firebase configuration (same as in your firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAc0WzUsgae17Zyo4dN3WfuBIvgpVBrTQA",
  authDomain: "techvaseegrah-runanddevelop.firebaseapp.com",
  projectId: "techvaseegrah-runanddevelop",
  storageBucket: "techvaseegrah-runanddevelop.firebasestorage.app",
  messagingSenderId: "876140121414",
  appId: "1:876140121414:web:4bc391bcb17cbe35c32947",
  measurementId: "G-GZJS335Y7G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample community posts data
const samplePosts = [
  {
    userId: "user1",
    userName: "Sarah Johnson",
    userPhoto: "/redlogo.png",
    userLevel: "Advanced",
    content: "Just completed my first 10K run with the R&D community! The energy was incredible and the support from fellow runners made all the difference. Can't wait for next week's session! 🏃‍♀️💪",
    image: "/event8.jpg",
    likes: 24,
    comments: 8,
    shares: 3,
    likedBy: {},
    timestamp: "2 hours ago",
    createdAt: new Date()
  },
  {
    userId: "user2",
    userName: "Mike Chen",
    userPhoto: "/redlogo.png",
    userLevel: "Intermediate",
    content: "Looking for running buddies for tomorrow's early morning session. Anyone interested in a 5K run around C3 Cafe area? Let's motivate each other!",
    likes: 12,
    comments: 15,
    shares: 2,
    likedBy: {},
    timestamp: "4 hours ago",
    createdAt: new Date(Date.now() - 3600000)
  },
  {
    userId: "user3",
    userName: "Priya Patel",
    userPhoto: "/redlogo.png",
    userLevel: "Beginner",
    content: "Today's mindful running session was exactly what I needed. The breathing techniques and meditation before the run really helped me stay focused. Thank you R&D for introducing me to this holistic approach!",
    image: "/event7.jpg",
    likes: 31,
    comments: 12,
    shares: 7,
    likedBy: {},
    timestamp: "6 hours ago",
    createdAt: new Date(Date.now() - 7200000)
  }
];

// Sample leaderboard data
const sampleLeaderboard = [
  { name: "Alex Kumar", runs: 45, distance: 180.5, level: "Elite" },
  { name: "Maria Santos", runs: 42, distance: 168.2, level: "Advanced" },
  { name: "David Kim", runs: 38, distance: 152.8, level: "Advanced" },
  { name: "Lisa Wang", runs: 35, distance: 140.3, level: "Intermediate" },
  { name: "Raj Patel", runs: 32, distance: 128.7, level: "Intermediate" }
];

// Function to initialize community posts
async function initCommunityPosts() {
  try {
    for (const post of samplePosts) {
      const docRef = await addDoc(collection(db, "communityPosts"), post);
      console.log("Post added with ID: ", docRef.id);
    }
    console.log("All sample posts added successfully!");
  } catch (error) {
    console.error("Error adding sample posts: ", error);
  }
}

// Function to initialize leaderboard
async function initLeaderboard() {
  try {
    for (const runner of sampleLeaderboard) {
      const docRef = await addDoc(collection(db, "leaderboard"), runner);
      console.log("Leaderboard entry added with ID: ", docRef.id);
    }
    console.log("All leaderboard entries added successfully!");
  } catch (error) {
    console.error("Error adding leaderboard entries: ", error);
  }
}

// Run the initialization
async function initAllData() {
  console.log("Initializing community data...");
  await initCommunityPosts();
  await initLeaderboard();
  console.log("Community data initialization complete!");
}

// Run if this script is executed directly
if (typeof window === 'undefined') {
  initAllData();
}

export { initCommunityPosts, initLeaderboard };