useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      try {
        // Fetch user data from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        let userData = {};
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          // If user document doesn't exist, create initial data
          userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'User',
            createdAt: new Date(),
            totalRuns: 0,
            totalDistance: 0,
            currentStreak: 0,
            bestTime: 'N/A',
            level: 'Beginner'
          };
        }
        
        const userObject = {
          uid: currentUser.uid,
          name: currentUser.displayName || userData.displayName || 'User',
          email: currentUser.email || userData.email || 'No email provided',
          phone: currentUser.phoneNumber || userData.phoneNumber || 'No phone provided',
          photoURL: currentUser.photoURL || null,
          memberSince: new Date(currentUser.metadata.creationTime).toLocaleDateString() || 'Unknown',
          totalRuns: userData.totalRuns || 0,
          totalDistance: userData.totalDistance || 0,
          currentStreak: userData.currentStreak || 0,
          bestTime: userData.bestTime || 'N/A',
          level: userData.level || 'Beginner'
        };
        
        console.log('Setting user object:', userObject); // Debug log
        setUser(userObject);
        
        // Fetch user stats, events, and bookings
        await fetchUserStats(currentUser.uid);
        await fetchUpcomingEvents();
        await fetchUserBookings(currentUser.uid);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to basic user data
        const userObject = {
          uid: currentUser.uid,
          name: currentUser.displayName || 'User',
          email: currentUser.email || 'No email provided',
          phone: currentUser.phoneNumber || 'No phone provided',
          photoURL: currentUser.photoURL || null,
          memberSince: new Date(currentUser.metadata.creationTime).toLocaleDateString() || 'Unknown',
          totalRuns: 0,
          totalDistance: 0,
          currentStreak: 0,
          bestTime: 'N/A',
          level: 'Beginner'
        };
        
        console.log('Setting fallback user object:', userObject); // Debug log
        setUser(userObject);
        setLoading(false);
      }
    } else {
      console.log('No current user, navigating to signin'); // Debug log
      navigate('/signin');
      setLoading(false);
    }
  });

  return () => unsubscribe();
}, [navigate]);

// Debug useEffect to see when user changes
useEffect(() => {
  console.log('User state changed:', user);
}, [user]);