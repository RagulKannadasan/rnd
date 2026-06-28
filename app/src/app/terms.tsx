import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>Welcome to Run and Develop. We're glad you're here. These Terms of Service ("Terms") explain how our app and services work. By using the app, creating an account, or booking a slot, you agree to these Terms. We value respect, transparency, and community, and we request you to read this carefully.</Text>

        <Text style={styles.h2}>1. Our Purpose</Text>
        <Text style={styles.paragraph}>Run and Develop is a space where running meets personal growth. Our aim is to connect, inspire, and support individuals through events, ideas, and experiences.</Text>

        <Text style={styles.h2}>2. User Responsibilities</Text>
        <Text style={styles.paragraph}>To use our app and participate in our programs, you confirm that:</Text>
        <Text style={styles.bullet}>• You are 16 years or older</Text>
        <Text style={styles.bullet}>• The details you provide are truthful and accurate</Text>
        <Text style={styles.bullet}>• You will use our platform in a respectful and responsible manner</Text>

        <Text style={styles.h2}>3. Event & Slot Booking</Text>
        <Text style={styles.bullet}>• A booking is confirmed only after successful payment</Text>
        <Text style={styles.bullet}>• Participants must follow event guidelines and safety instructions</Text>
        <Text style={styles.bullet}>• Since running and physical activities involve personal judgment, you understand that you are participating voluntarily and at your own risk</Text>
        
        <Text style={styles.h2}>4. Payments & Refunds</Text>
        <Text style={styles.bullet}>• Payments are processed securely through trusted third-party gateways</Text>
        <Text style={styles.bullet}>• Event fees are non-refundable, except in cases where the event is cancelled by us</Text>

        <Text style={styles.h2}>5. Limitation of Liability</Text>
        <Text style={styles.paragraph}>We will always do our best to provide a safe, smooth, and inspiring experience. However, we are not responsible for any injuries or health issues during events or activities.</Text>

        <Text style={styles.h2}>6. Contact Us</Text>
        <Text style={styles.paragraph}>If you have questions, suggestions, or concerns, we are here to support you at runanddevelop@gmail.com.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  backBtn: { padding: 8, marginLeft: -8 },
  backBtnText: { color: '#888', fontSize: 16 },
  content: { padding: 20, paddingBottom: 60 },
  h2: { color: '#F15A24', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  paragraph: { color: '#ccc', fontSize: 15, lineHeight: 24, marginBottom: 12 },
  bullet: { color: '#ccc', fontSize: 15, lineHeight: 24, marginLeft: 8, marginBottom: 4 }
});
