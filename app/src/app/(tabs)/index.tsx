import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';

// Custom Icons (since we can't easily use react-icons, we'll use emojis or simple text for now)
const RunIcon = () => <Text style={{fontSize: 20}}>🏃‍♂️</Text>;
const TicketIcon = () => <Text style={{fontSize: 20}}>🎫</Text>;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [userStats, setUserStats] = useState({
    totalRuns: 0,
    totalDistance: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [fullScreenTicket, setFullScreenTicket] = useState<any>(null);

  const calculateUserStats = useCallback(async (userId: string) => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const totalRuns = querySnapshot.size;
      const totalDistance = totalRuns * 2;
      return { totalRuns, totalDistance, currentStreak: 0 };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return { totalRuns: 0, totalDistance: 0, currentStreak: 0 };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [bookingsSnap, stats] = await Promise.all([
          getDocs(query(collection(db, 'bookings'), where('userId', '==', user.uid))),
          calculateUserStats(user.uid),
        ]);

        if (!isMounted) return;

        const userBookings = bookingsSnap.docs.map(docSnap => {
          const data = docSnap.data();
          let eventDate = new Date();
          if (data.eventDate) {
            if (typeof data.eventDate.toDate === 'function') eventDate = data.eventDate.toDate();
            else if (typeof data.eventDate === 'string') eventDate = new Date(data.eventDate);
            else if (data.eventDate.seconds) eventDate = new Date(data.eventDate.seconds * 1000);
          }
          return { id: docSnap.id, ...data, eventDate };
        });

        setBookings(userBookings);
        setUserStats({
          totalRuns: stats.totalRuns || 0,
          totalDistance: stats.totalDistance || 0,
          currentStreak: stats.currentStreak || 0,
        });
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Periodic refresh
    const interval = setInterval(fetchDashboardData, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.uid, calculateUserStats]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // AuthContext will handle redirect
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const generateQRData = (booking: any) => {
    if (!booking || !user) return null;
    return JSON.stringify({
      id: booking.id || 'N/A',
      event: booking.eventName || 'Event Name',
      date: booking.eventDate ? booking.eventDate.toISOString() : new Date().toISOString(),
      user: user.name || 'User',
      userId: user.uid || 'N/A',
      ticketType: booking.isFreeTrial ? 'FREE_TRIAL' : 'PAID',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F15A24" />
        <Text style={{color: '#fff', marginTop: 10}}>Loading dashboard...</Text>
      </View>
    );
  }

  // Sort bookings
  const sortedBookings = [...bookings].sort((a, b) => b.eventDate - a.eventDate);
  const mostRecentBooking = sortedBookings[0];
  const hasPaidPlan = bookings.some(b => !b.isFreeTrial);
  const hasFreeTrial = bookings.some(b => b.isFreeTrial);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Card */}
        <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/profile')}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {user?.photoURL ? (
                <Image source={{uri: user.photoURL}} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.greeting}>{user?.name || 'Runner'}</Text>
              <Text style={{color: '#888', marginTop: 4}}>Tap to view profile</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Stats Card */}
        <View style={styles.card}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalRuns}</Text>
              <Text style={styles.statLabel}>Total Runs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalDistance} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Event */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TicketIcon />
            <Text style={styles.cardTitle}>Upcoming Event</Text>
          </View>
          
          {mostRecentBooking ? (
            <View style={styles.eventItem}>
              <Text style={styles.eventName}>{mostRecentBooking.eventName}</Text>
              <Text style={styles.eventDetails}>
                {mostRecentBooking.eventDate?.toDateString()} • {mostRecentBooking.eventTime || 'Time TBD'}
              </Text>
              <Text style={styles.eventStatus}>
                Status: <Text style={{color: '#00ff88'}}>Confirmed</Text>
              </Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => setFullScreenTicket(mostRecentBooking)}
              >
                <Text style={styles.buttonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming events.</Text>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => router.push('/(tabs)/plans')}
              >
                <Text style={styles.secondaryButtonText}>Find Events</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Plan */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <RunIcon />
            <Text style={styles.cardTitle}>My Plan</Text>
          </View>
          <View style={styles.planContent}>
            {hasPaidPlan ? (
              <>
                <Text style={styles.planName}>{bookings.find(b => !b.isFreeTrial)?.eventName || 'Paid Plan'}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/plans')}>
                  <Text style={styles.buttonText}>Manage Plan</Text>
                </TouchableOpacity>
              </>
            ) : hasFreeTrial ? (
              <>
                <Text style={styles.planName}>Free Trial</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/plans')}>
                  <Text style={styles.buttonText}>Upgrade Plan</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.planName}>No Active Plan</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/plans')}>
                  <Text style={styles.buttonText}>Choose Plan</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

      </ScrollView>

      {/* Ticket Modal */}
      <Modal
        visible={!!fullScreenTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFullScreenTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setFullScreenTicket(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{fullScreenTicket?.eventName}</Text>
            <Text style={styles.modalSubtitle}>ID: {fullScreenTicket?.id}</Text>
            
            <View style={styles.qrContainer}>
              {generateQRData(fullScreenTicket) ? (
                <QRCode
                  value={generateQRData(fullScreenTicket)!}
                  size={200}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <Text>QR Unavailable</Text>
              )}
            </View>
            <Text style={styles.qrHelp}>Scan at event entrance</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F15A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutText: {
    color: '#ff4444',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#F15A24',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventItem: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  eventName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDetails: {
    color: '#aaa',
    fontSize: 14,
  },
  eventStatus: {
    color: '#888',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#F15A24',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#888',
    marginBottom: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#F15A24',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#F15A24',
    fontWeight: 'bold',
    fontSize: 16,
  },
  planContent: {
    gap: 16,
  },
  planName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalTitle: {
    color: '#F15A24',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  qrHelp: {
    color: '#888',
    marginTop: 16,
  }
});
