// Script to check Firestore database using client SDK (no service account needed)
// This script can be run in Node.js with firebase-admin or in browser console

const firebaseConfig = {
  apiKey: "AIzaSyAc0WzUsgae17Zyo4dN3WfuBIvgpVBrTQA",
  authDomain: "techvaseegrah-runanddevelop.firebaseapp.com",
  projectId: "techvaseegrah-runanddevelop",
  storageBucket: "techvaseegrah-runanddevelop.firebasestorage.app",
  messagingSenderId: "876140121414",
  appId: "1:876140121414:web:4bc391bcb17cbe35c32947",
  measurementId: "G-GZJS335Y7G"
};

console.log('📊 Firestore Database Check');
console.log('Project:', firebaseConfig.projectId);
console.log('='.repeat(60));
console.log('\n⚠️  To check your database, you have two options:\n');
console.log('Option 1: Use Firebase Console (Recommended)');
console.log('  1. Go to: https://console.firebase.google.com/');
console.log('  2. Select project: techvaseegrah-runanddevelop');
console.log('  3. Navigate to: Firestore Database');
console.log('  4. View all collections and documents\n');
console.log('Option 2: Use Browser Console');
console.log('  Open your app in browser and run this in console:\n');
console.log(`
// Copy and paste this into browser console:
import { getFirestore, collection, getDocs, query, limit } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const db = getFirestore();
const collections = ['users', 'bookings', 'events', 'upcomingEvents', 'pastEvents', 'communityPosts'];

async function checkDB() {
  for (const colName of collections) {
    try {
      const q = query(collection(db, colName), limit(5));
      const snapshot = await getDocs(q);
      console.log(\`\\n\${colName}: \${snapshot.size} documents (showing first 5)\`);
      snapshot.forEach(doc => {
        console.log(\`  - \${doc.id}:\`, doc.data());
      });
    } catch (e) {
      console.log(\`\\n\${colName}: Error - \${e.message}\`);
    }
  }
}
checkDB();
`);

console.log('\nOption 3: Check via Firebase CLI');
console.log('  If you have Firebase CLI installed:');
console.log('  firebase firestore:get --project techvaseegrah-runanddevelop\n');

console.log('📋 Expected Collections:');
console.log('  - users: User profiles');
console.log('  - bookings: Event bookings');
console.log('  - events / upcomingEvents / pastEvents: Event data');
console.log('  - communityPosts: Community posts');
console.log('  - contacts: Contact form submissions');
console.log('  - userProfiles: Fitness tracker profiles');
console.log('  - mealLogs: Meal tracking data');
console.log('  - workoutLogs: Workout tracking data\n');

console.log('🔗 Direct Links:');
console.log('  Firestore Console: https://console.firebase.google.com/project/techvaseegrah-runanddevelop/firestore');
console.log('  Authentication: https://console.firebase.google.com/project/techvaseegrah-runanddevelop/authentication');
console.log('  Storage: https://console.firebase.google.com/project/techvaseegrah-runanddevelop/storage\n');

