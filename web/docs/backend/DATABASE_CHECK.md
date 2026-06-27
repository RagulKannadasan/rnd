# Database Check Guide

## Quick Access Links

### 🔥 Firebase Console (Best Option)
**Direct Link to Firestore:**
https://console.firebase.google.com/project/techvaseegrah-runanddevelop/firestore

**Direct Link to Authentication:**
https://console.firebase.google.com/project/techvaseegrah-runanddevelop/authentication

## Collections to Check

### Main Collections:
1. **users** - User profiles and authentication data
2. **bookings** - Event bookings and payments
3. **events** - Event information
4. **upcomingEvents** - Upcoming events
5. **pastEvents** - Past events
6. **communityPosts** - Community feed posts
7. **contacts** - Contact form submissions

### Fitness Tracker Collections:
8. **userProfiles** - Fitness tracker user profiles
9. **mealLogs** - Meal tracking data
10. **workoutLogs** - Workout tracking data
11. **userGoals** - User fitness goals
12. **nutritionData** - Nutrition information

## Browser Console Check

Open your app in browser (http://localhost:3000) and paste this in the console:

```javascript
// Database Check Script
(async function() {
  const { getFirestore, collection, getDocs, query, limit, orderBy } = await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');
  
  // Import your Firebase config
  const { db } = await import('./src/firebase.js');
  
  const collections = [
    'users',
    'bookings', 
    'events',
    'upcomingEvents',
    'pastEvents',
    'communityPosts',
    'contacts',
    'userProfiles',
    'mealLogs',
    'workoutLogs'
  ];
  
  console.log('🔍 Checking Firestore Database...\n');
  
  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const q = query(colRef, limit(3));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log(`❌ ${colName}: Empty (0 documents)`);
      } else {
        // Get total count
        const allDocs = await getDocs(colRef);
        console.log(`✅ ${colName}: ${allDocs.size} documents`);
        
        // Show sample
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   [${index + 1}] ${doc.id}:`, {
            ...Object.keys(data).slice(0, 5).reduce((acc, key) => {
              const val = data[key];
              if (val && typeof val === 'object' && val.toDate) {
                acc[key] = val.toDate().toISOString();
              } else if (typeof val === 'string' && val.length > 30) {
                acc[key] = val.substring(0, 30) + '...';
              } else {
                acc[key] = val;
              }
              return acc;
            }, {})
          });
        });
      }
    } catch (e) {
      console.log(`⚠️  ${colName}: Error - ${e.message}`);
    }
  }
  
  console.log('\n✅ Database check complete!');
})();
```

## What to Check

### 1. Users Collection
- Check if user documents exist
- Verify user profile data structure
- Check authentication UIDs match document IDs

### 2. Bookings Collection
- Verify booking documents are being created
- Check payment status fields
- Verify eventId and userId references

### 3. Events Collections
- Check upcomingEvents and pastEvents
- Verify event data structure
- Check bookingStatus fields

### 4. Community Posts
- Check if posts are being created
- Verify user references

## Common Issues to Look For

1. **Missing Collections**: If a collection doesn't exist, it might need initialization
2. **Empty Collections**: Collections might be empty if no data has been created yet
3. **Permission Errors**: Check Firestore security rules if you see permission errors
4. **Data Structure**: Verify fields match what your code expects

## Next Steps

After checking:
1. Note which collections exist and have data
2. Check if data structure matches your code expectations
3. Verify security rules allow necessary operations
4. Check for any missing indexes (Firebase will warn you)

