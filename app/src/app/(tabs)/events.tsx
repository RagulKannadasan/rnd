import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [mainEvent, setMainEvent] = useState<any>(null);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchEventAndBookings = async () => {
      try {
        const token = user ? await user.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
        
        // Fetch Upcoming Events
        const upRes = await fetch(`${apiUrl}/api/events/upcoming`, { headers });
        const events = upRes.ok ? await upRes.json() : [];
        
        // Fetch Past Events
        const pastRes = await fetch(`${apiUrl}/api/events/past`, { headers });
        const past = pastRes.ok ? await pastRes.json() : [];
        setPastEvents(past);
        
        const weeklyRun = events.find((e: any) => e.name && e.name.includes('Weekly Community Run')) || events[0];
        
        if (weeklyRun) {
          setMainEvent(weeklyRun);
        } else {
          setMainEvent({
            id: 'event_001',
            name: 'Weekly Community Run',
            date: new Date().toISOString().split('T')[0],
            time: '07:00 AM',
            location: 'C3 Cafe, City Park',
            description: 'Join fellow runners for an unforgettable experience.',
            schedule: [
              { time: '06:30 AM', activity: 'Assembly & Warm-up' },
              { time: '07:00 AM', activity: 'Run Starts' },
              { time: '08:00 AM', activity: 'Cool down & Networking' }
            ],
            image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2070&auto=format&fit=crop'
          });
        }
        
        // Fetch User Bookings to disable button
        if (user && token) {
          const bRes = await fetch(`${apiUrl}/api/users/bookings`, { headers });
          if (bRes.ok) {
            setUserBookings(await bRes.json());
          }
        }
        
      } catch (e) {
        console.error('Error fetching events:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventAndBookings();
  }, [user]);

  const hasUserBookedEvent = (eventId: string) => {
    return userBookings.some(b => String(b.eventId) === String(eventId));
  };

  const handleRegister = () => {
    if (!user) {
      router.push('/(auth)/signin');
      return;
    }
    
    // Navigate to plans page to book
    router.push('/(tabs)/plans');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F15A24" />
        <Text style={{color: '#fff', marginTop: 10}}>Loading events...</Text>
      </View>
    );
  }

  const getProgressPercentage = (participants: number, max: number) => {
    if (!max) return 0;
    return Math.min((participants / max) * 100, 100);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upcoming Events</Text>
          <Text style={styles.headerSubtitle}>Join our community runs and be part of something amazing!</Text>
        </View>

        {mainEvent ? (
          <TouchableOpacity 
            style={styles.eventCard} 
            activeOpacity={0.8}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <View style={styles.imageWrapper}>
              {mainEvent.image ? (
                <Image source={{ uri: mainEvent.image }} style={styles.eventImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text style={styles.placeholderText}>Run Event</Text>
                </View>
              )}
            </View>

            <View style={styles.eventContent}>
              <Text style={styles.eventName}>{mainEvent.name}</Text>
              
              <View style={styles.eventMeta}>
                <Text style={styles.eventDate}>{mainEvent.date}</Text>
                <Text style={styles.eventTime}>{mainEvent.time}</Text>
              </View>
              
              <Text style={styles.eventLocation}>📍 {mainEvent.location}</Text>
              
              {isExpanded && (
                <Text style={styles.eventDescription}>{mainEvent.description}</Text>
              )}

              <View style={styles.statsContainer}>
                <Text style={styles.statsLabel}>Registration Progress</Text>
                <Text style={styles.statsCount}>{mainEvent.participants || 0} of {mainEvent.maxParticipants || 50} spots</Text>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${getProgressPercentage(mainEvent.participants, mainEvent.maxParticipants)}%` }
                    ]} 
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.bookBtn, 
                  hasUserBookedEvent(mainEvent.id) && styles.bookBtnDisabled
                ]}
                onPress={handleRegister}
                disabled={hasUserBookedEvent(mainEvent.id)}
              >
                <Text style={styles.bookBtnText}>
                  {hasUserBookedEvent(mainEvent.id) ? 'Already Booked' : 'Book Your Slot Now'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.toggleText}>
                {isExpanded ? 'Tap to collapse details ▲' : 'Tap to expand details ▼'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noEventsText}>No upcoming events at the moment. Check back soon!</Text>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.headerTitle}>Past Events</Text>
        </View>

        {pastEvents.length > 0 ? (
          pastEvents.map((event) => (
            <View key={event.id} style={styles.pastEventCard}>
              <View style={styles.imageWrapper}>
                {event.image || event.imageUrl ? (
                  <Image source={{ uri: event.image || event.imageUrl }} style={styles.eventImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>Run Event</Text>
                  </View>
                )}
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
              </View>
              <View style={styles.eventContent}>
                <Text style={styles.eventName}>{event.title || event.name}</Text>
                <View style={styles.eventMeta}>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.eventTime}>{event.time || 'TBD'}</Text>
                </View>
                <Text style={styles.eventLocation}>📍 {event.location}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noEventsText}>No past events available.</Text>
        )}
      </ScrollView>
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
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 16,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 200,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 24,
    fontWeight: 'bold',
  },
  eventContent: {
    padding: 20,
  },
  eventName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  eventDate: {
    color: '#F15A24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventTime: {
    color: '#aaa',
    fontSize: 14,
  },
  eventLocation: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  eventDescription: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statsCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F15A24',
  },
  bookBtn: {
    backgroundColor: '#F15A24',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  bookBtnDisabled: {
    backgroundColor: '#333',
  },
  bookBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  noEventsText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionHeader: {
    marginTop: 40,
    marginBottom: 24,
  },
  pastEventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  completedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  completedBadgeText: {
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
