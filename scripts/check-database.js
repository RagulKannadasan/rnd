// Script to check Firestore database structure and data
require('dotenv').config({ path: __dirname + '/../.env' });

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

// Check if service account file exists
const serviceAccountPath = require('path').join(__dirname, 'firebase-service-account.json');

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Firebase service account file not found at:', serviceAccountPath);
  console.error('Please create firebase-service-account.json in the scripts/ directory');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to check
const collectionsToCheck = [
  'users',
  'bookings',
  'events',
  'upcomingEvents',
  'pastEvents',
  'communityPosts',
  'leaderboard',
  'contacts',
  'userProfiles',
  'mealLogs',
  'workoutLogs',
  'userGoals',
  'nutritionData'
];

async function checkCollection(collectionName) {
  try {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.limit(5).get();
    
    if (snapshot.empty) {
      return { name: collectionName, count: 0, exists: false, sample: null };
    }
    
    const countSnapshot = await collectionRef.count().get();
    const totalCount = countSnapshot.data().count;
    
    const sampleDocs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Timestamps to readable format
      const cleanData = {};
      Object.keys(data).forEach(key => {
        if (data[key] && typeof data[key] === 'object' && data[key].toDate) {
          cleanData[key] = data[key].toDate().toISOString();
        } else if (data[key] && typeof data[key] === 'object' && data[key]._seconds) {
          cleanData[key] = new Date(data[key]._seconds * 1000).toISOString();
        } else {
          cleanData[key] = data[key];
        }
      });
      sampleDocs.push({
        id: doc.id,
        ...cleanData
      });
    });
    
    return {
      name: collectionName,
      count: totalCount,
      exists: true,
      sample: sampleDocs.length > 0 ? sampleDocs : null
    };
  } catch (error) {
    if (error.code === 'permission-denied') {
      return { name: collectionName, count: 0, exists: false, error: 'Permission denied' };
    }
    return { name: collectionName, count: 0, exists: false, error: error.message };
  }
}

async function checkDatabase() {
  console.log('🔍 Checking Firestore Database...\n');
  console.log('Project:', serviceAccount.project_id);
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const collectionName of collectionsToCheck) {
    const result = await checkCollection(collectionName);
    results.push(result);
    
    if (result.exists) {
      console.log(`\n✅ Collection: ${collectionName}`);
      console.log(`   Total Documents: ${result.count}`);
      
      if (result.sample && result.sample.length > 0) {
        console.log(`   Sample Documents (showing ${result.sample.length}):`);
        result.sample.forEach((doc, index) => {
          console.log(`\n   [${index + 1}] Document ID: ${doc.id}`);
          // Show key fields only
          const keysToShow = Object.keys(doc).filter(k => k !== 'id').slice(0, 5);
          keysToShow.forEach(key => {
            const value = doc[key];
            if (typeof value === 'string' && value.length > 50) {
              console.log(`      ${key}: ${value.substring(0, 50)}...`);
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              console.log(`      ${key}: [Object]`);
            } else {
              console.log(`      ${key}: ${JSON.stringify(value)}`);
            }
          });
        });
      }
    } else if (result.error) {
      console.log(`\n⚠️  Collection: ${collectionName}`);
      console.log(`   Error: ${result.error}`);
    } else {
      console.log(`\n❌ Collection: ${collectionName} - Empty or doesn't exist`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  const existingCollections = results.filter(r => r.exists);
  const emptyCollections = results.filter(r => !r.exists && !r.error);
  const errorCollections = results.filter(r => r.error);
  
  console.log(`\n✅ Collections with data: ${existingCollections.length}`);
  existingCollections.forEach(r => {
    console.log(`   - ${r.name}: ${r.count} documents`);
  });
  
  if (emptyCollections.length > 0) {
    console.log(`\n❌ Empty/Non-existent collections: ${emptyCollections.length}`);
    emptyCollections.forEach(r => {
      console.log(`   - ${r.name}`);
    });
  }
  
  if (errorCollections.length > 0) {
    console.log(`\n⚠️  Collections with errors: ${errorCollections.length}`);
    errorCollections.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  }
  
  // Check specific important collections in detail
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Detailed Checks:');
  
  // Check bookings
  const bookingsResult = results.find(r => r.name === 'bookings');
  if (bookingsResult && bookingsResult.exists) {
    console.log('\n📦 Bookings Collection:');
    const bookingsRef = db.collection('bookings');
    const recentBookings = await bookingsRef.orderBy('bookingDate', 'desc').limit(3).get();
    console.log(`   Recent bookings (last 3):`);
    recentBookings.forEach(doc => {
      const data = doc.data();
      console.log(`   - ID: ${doc.id}`);
      console.log(`     User: ${data.userName || data.userId || 'N/A'}`);
      console.log(`     Event: ${data.eventName || 'N/A'}`);
      console.log(`     Status: ${data.status || 'N/A'}`);
      console.log(`     Mode: ${data.mode || data.paymentMethod || 'N/A'}`);
      if (data.bookingDate) {
        const date = data.bookingDate.toDate ? data.bookingDate.toDate() : new Date(data.bookingDate);
        console.log(`     Date: ${date.toISOString()}`);
      }
    });
  }
  
  // Check users
  const usersResult = results.find(r => r.name === 'users');
  if (usersResult && usersResult.exists) {
    console.log('\n👥 Users Collection:');
    const usersRef = db.collection('users');
    const userSample = await usersRef.limit(3).get();
    console.log(`   Sample users (first 3):`);
    userSample.forEach(doc => {
      const data = doc.data();
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Name: ${data.displayName || data.name || 'N/A'}`);
      console.log(`     Email: ${data.email || 'N/A'}`);
      console.log(`     Phone: ${data.phoneNumber || 'N/A'}`);
    });
  }
  
  // Check events
  const eventsResult = results.find(r => r.name === 'events' || r.name === 'upcomingEvents');
  if (eventsResult && eventsResult.exists) {
    console.log('\n📅 Events Collection:');
    const eventsRef = db.collection(eventsResult.name);
    const eventsSample = await eventsRef.limit(3).get();
    console.log(`   Sample events (first 3):`);
    eventsSample.forEach(doc => {
      const data = doc.data();
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Name: ${data.name || data.title || 'N/A'}`);
      console.log(`     Date: ${data.date || data.eventDate || 'N/A'}`);
      console.log(`     Status: ${data.bookingStatus || 'N/A'}`);
    });
  }
  
  console.log('\n✅ Database check complete!\n');
  
  process.exit(0);
}

// Run the check
checkDatabase().catch(error => {
  console.error('❌ Error checking database:', error);
  process.exit(1);
});

