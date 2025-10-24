// CHECK_USER_BOOKINGS.js
// Script to check a specific user's bookings in the database

// INSTRUCTIONS:
// 1. Open your web application in the browser
// 2. Make sure you're logged in as an admin user
// 3. Open the developer tools (F12 or right-click and select "Inspect")
// 4. Go to the Console tab
// 5. Copy and paste this code into the console and press Enter
// 6. Replace 'USERNAME_TO_CHECK' with the actual username (e.g., 'Navas')

async function checkUserBookings(username) {
  try {
    console.log(`Checking bookings for user: ${username}`);
    
    // Get Firestore reference
    const db = firebase.firestore();
    
    // First, try to find the user by displayName
    const usersSnapshot = await db.collection('users')
      .where('displayName', '==', username)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with displayName: ${username}`);
      // Try to find users whose displayName contains the username
      const usersSnapshot2 = await db.collection('users')
        .orderBy('displayName')
        .startAt(username)
        .endAt(username + '\uf8ff')
        .get();
      
      if (usersSnapshot2.empty) {
        console.log(`No users found with displayName containing: ${username}`);
        console.log('Checking all users...');
        
        // List all users
        const allUsersSnapshot = await db.collection('users').get();
        console.log(`Total users in database: ${allUsersSnapshot.size}`);
        allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log(`User ID: ${doc.id}, Name: ${userData.displayName || userData.name || 'N/A'}, Email: ${userData.email || 'N/A'}`);
        });
        return;
      } else {
        console.log(`Found ${usersSnapshot2.size} users with displayName containing: ${username}`);
        usersSnapshot2.forEach(doc => {
          const userData = doc.data();
          console.log(`User ID: ${doc.id}, Name: ${userData.displayName || userData.name || 'N/A'}, Email: ${userData.email || 'N/A'}`);
        });
      }
    } else {
      console.log(`Found ${usersSnapshot.size} user(s) with displayName: ${username}`);
      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`User ID: ${userId}`);
      console.log(`User Data:`, userData);
      
      // Now check bookings for this user
      const bookingsSnapshot = await db.collection('bookings')
        .where('userId', '==', userId)
        .get();
      
      console.log(`Found ${bookingsSnapshot.size} bookings for user ${username} (ID: ${userId})`);
      
      if (!bookingsSnapshot.empty) {
        console.log('Booking details:');
        bookingsSnapshot.forEach(doc => {
          const bookingData = doc.data();
          console.log(`- Booking ID: ${doc.id}`);
          console.log(`  Event: ${bookingData.eventName || 'N/A'}`);
          console.log(`  Date: ${bookingData.eventDate ? bookingData.eventDate.toDate().toString() : 'N/A'}`);
          console.log(`  Status: ${bookingData.status || 'N/A'}`);
          console.log(`  Booking Date: ${bookingData.bookingDate ? bookingData.bookingDate.toDate().toString() : 'N/A'}`);
          console.log('---');
        });
      }
      
      // Also check user statistics
      const statsDoc = await db.collection('userStatistics').doc(userId).get();
      if (statsDoc.exists) {
        console.log('User Statistics:', statsDoc.data());
      } else {
        console.log('No statistics found for this user');
      }
    }
  } catch (error) {
    console.error('Error checking user bookings:', error);
  }
}

// Run the function - replace 'Navas' with the actual username you want to check
checkUserBookings('Navas');