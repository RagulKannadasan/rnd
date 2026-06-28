import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>Run and Develop is a fitness event management platform connecting running enthusiasts in the community. We organize weekly running events, provide fitness tracking tools, and facilitate event bookings. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our app and services. By accessing our app, you agree to the practices described in this policy.</Text>

        <Text style={styles.h2}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>We collect the following personal information from users when they register, book slots, or use our services:</Text>
        <Text style={styles.bullet}>• Name</Text>
        <Text style={styles.bullet}>• Age & Date of Birth</Text>
        <Text style={styles.bullet}>• Gender</Text>
        <Text style={styles.bullet}>• Profession</Text>
        <Text style={styles.bullet}>• Phone Number</Text>
        
        <Text style={styles.paragraph}>We may also collect:</Text>
        <Text style={styles.bullet}>• Login details (for user accounts)</Text>
        <Text style={styles.bullet}>• Payment information (processed securely by third-party payment gateways)</Text>
        <Text style={styles.bullet}>• Device and usage data (to improve app experience)</Text>

        <Text style={styles.h2}>2. How We Use Your Information</Text>
        <Text style={styles.bullet}>• Create and manage your user account</Text>
        <Text style={styles.bullet}>• Process slot bookings and payments</Text>
        <Text style={styles.bullet}>• Communicate event details, updates and reminders</Text>
        <Text style={styles.bullet}>• Improve our programs, events and app experience</Text>
        <Text style={styles.bullet}>• Provide customer support</Text>

        <Text style={styles.h2}>3. Data Security</Text>
        <Text style={styles.paragraph}>We use industry-standard security measures to protect your data. However, no method of online transmission is 100% secure, and you agree that you use the service at your own risk.</Text>

        <Text style={styles.h2}>4. Contact Us</Text>
        <Text style={styles.paragraph}>For questions or concerns, email us at: runanddevelop@gmail.com</Text>
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
