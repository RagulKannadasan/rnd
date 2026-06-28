import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function FAQScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Frequently Asked Questions</Text>

        <Text style={styles.h2}>1. What is Run and Develop?</Text>
        <Text style={styles.paragraph}>Run and Develop is a fitness event management platform connecting running enthusiasts in the community. We organize weekly running events, provide fitness tracking tools, and facilitate event bookings. We believe that when the body moves, the mind opens — helping us improve our personal and professional life.</Text>

        <Text style={styles.h2}>2. Who can join the community?</Text>
        <Text style={styles.paragraph}>Anyone who is interested in self-growth, fitness, or meaningful connections can join. Whether you're a beginner, a regular runner, or someone who just wants a fresh start — you are welcome here.</Text>

        <Text style={styles.h2}>3. Do I need to be an experienced runner?</Text>
        <Text style={styles.paragraph}>Not at all. Our community includes all levels — beginners, casual runners, and experienced athletes. You can run at your own pace. No pressure, no comparison — just progress.</Text>

        <Text style={styles.h2}>4. What is the purpose of combining running and ideas?</Text>
        <Text style={styles.paragraph}>We believe that running strengthens the body, and reflection strengthens the mind. When both grow together, life becomes more meaningful, focused, and joyful.</Text>
        
        <Text style={styles.h2}>5. How often do you conduct runs or activities?</Text>
        <Text style={styles.paragraph}>We conduct our community runs every Sunday, where we come together to move, connect, reflect, and grow as a team.</Text>

        <Text style={styles.h2}>6. What should I bring for a run?</Text>
        <Text style={styles.paragraph}>Just wear comfortable sports clothing, proper shoes, and carry a water bottle. Most importantly — bring a smile and an open, positive mindset.</Text>

        <Text style={styles.h2}>7. Is the community beginner-friendly and supportive?</Text>
        <Text style={styles.paragraph}>Absolutely! Our culture is built on encouragement, empathy, and discipline — not comparison or judgment. We grow as a team.</Text>

        <Text style={styles.h2}>8. How will I stay updated about sessions?</Text>
        <Text style={styles.paragraph}>We will share updates through WhatsApp, email, or our website notification. Just make sure your contact details are correct.</Text>

        <Text style={styles.h2}>9. What if I can't attend regularly?</Text>
        <Text style={styles.paragraph}>No problem. Life gets busy — come whenever you can. Consistency is your goal, not perfection. We will be here whenever you show up.</Text>

        <Text style={styles.h2}>10. Can I bring a friend or family member?</Text>
        <Text style={styles.paragraph}>Yes! We love community energy. You can bring anyone who shares a positive and growth-oriented mindset.</Text>
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
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  h2: { color: '#F15A24', fontSize: 18, fontWeight: 'bold', marginTop: 24, marginBottom: 8 },
  paragraph: { color: '#ccc', fontSize: 15, lineHeight: 24, marginBottom: 12 }
});
