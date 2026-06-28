import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TicketVerificationScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams();
  const [ticketInfo, setTicketInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setError('No ticket data provided');
      return;
    }
    
    try {
      const parsedData = JSON.parse(decodeURIComponent(data as string));
      setTicketInfo({
        id: parsedData.id || 'N/A',
        eventName: parsedData.event || 'Unknown Event',
        eventDate: parsedData.date ? new Date(parsedData.date).toDateString() : 'Unknown Date',
        eventTime: parsedData.time || 'Unknown Time',
        eventLocation: parsedData.location || 'Location not available',
        userName: parsedData.user || 'Unknown User',
        userEmail: parsedData.userEmail || 'Email not available',
        phoneNumber: parsedData.phoneNumber || 'Phone not available',
        userId: parsedData.userId || 'User ID not available',
        bookingDate: parsedData.bookingDate ? new Date(parsedData.bookingDate).toDateString() : 'Unknown Date',
        isFreeTrial: parsedData.isFreeTrial || false,
        status: parsedData.status || 'confirmed'
      });
    } catch (err) {
      console.error('Error parsing ticket data:', err);
      setError('Invalid ticket data. Please make sure you scanned a valid QR code.');
    }
  }, [data]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
            <Text style={styles.backBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!ticketInfo) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff' }}>Loading ticket information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.ticketCard}>
        <View style={styles.ticketHeader}>
          <Text style={styles.headerTitle}>Event Ticket</Text>
          <View style={[styles.statusBadge, ticketInfo.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending]}>
            <Text style={styles.statusText}>{ticketInfo.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.ticketSection}>
          <Text style={styles.eventName}>{ticketInfo.eventName}</Text>
          <Text style={styles.eventDetail}>📅 {ticketInfo.eventDate}</Text>
          <Text style={styles.eventDetail}>⏰ {ticketInfo.eventTime}</Text>
          <Text style={styles.eventDetail}>📍 {ticketInfo.eventLocation}</Text>
        </View>
        
        <View style={styles.ticketSection}>
          <Text style={styles.sectionTitle}>Attendee Information</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Name:</Text> {ticketInfo.userName}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Email:</Text> {ticketInfo.userEmail}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Phone:</Text> {ticketInfo.phoneNumber}</Text>
        </View>
        
        <View style={[styles.ticketSection, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Booking ID:</Text> {ticketInfo.id}</Text>
          <Text style={styles.infoText}><Text style={styles.label}>Booking Date:</Text> {ticketInfo.bookingDate}</Text>
          {ticketInfo.isFreeTrial && (
            <View style={styles.freeTrialBadge}>
              <Text style={styles.freeTrialText}>FREE TRIAL</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
        <Text style={styles.backBtnText}>Done</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 20,
    padding: 24,
    marginTop: 60,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorMessage: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  ticketHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
  },
  statusPending: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ticketSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastSection: {
    borderBottomWidth: 0,
  },
  eventName: {
    color: '#F15A24',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  eventDetail: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#F15A24',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  label: {
    color: '#888',
    fontWeight: 'bold',
  },
  freeTrialBadge: {
    backgroundColor: 'rgba(241, 90, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#F15A24',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  freeTrialText: {
    color: '#F15A24',
    fontWeight: 'bold',
  },
  backBtn: {
    backgroundColor: '#F15A24',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
