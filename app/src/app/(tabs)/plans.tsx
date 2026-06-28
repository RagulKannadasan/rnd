import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';

import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const plansData = [
  {
    name: "Free Trial",
    subtitle: "For First-Time Participants",
    price: "0",
    duration: "1 Session",
    popular: false,
    freeTrial: true,
    features: [
      "Guided warm-up session",
      "1-hour community run",
      "Light post-run treats",
      "Networking with fellow runners"
    ],
  },
  {
    name: "Pay-Per-Run",
    subtitle: "Flexible Sessions",
    price: "99",
    duration: "Per Session",
    popular: true,
    freeTrial: false,
    features: [
      "Guided warm-up & cooldown",
      "1-hour structured run",
      "Healthy energy boosters",
      "Community networking"
    ],
  },
  {
    name: "Monthly Membership",
    subtitle: "Unlimited Access",
    price: "299",
    duration: "Per Month",
    popular: false,
    freeTrial: false,
    features: [
      "Unlimited weekly runs",
      "Personal fitness consultation",
      "Nutritious post-run meals",
      "Exclusive community events"
    ],
  }
];

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);

  const handlePurchase = async (plan: any) => {
    if (!user) {
      router.push('/(auth)/signin');
      return;
    }

    setProcessing(plan.name);
    try {
      // Simulate Payment API / Razorpay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const bookingData = {
        eventName: plan.name,
        eventId: `plan_${plan.name.toLowerCase().replace(/ /g, '_')}`,
        status: 'confirmed',
        amount: parseInt(plan.price),
        paymentId: `simulated_pay_${Date.now()}`,
        mode: plan.freeTrial ? 'free_trial' : 'razorpay',
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email || '',
        bookingDate: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      Alert.alert(
        'Payment Successful!', 
        `You have successfully booked: ${plan.name}`,
        [{ text: 'View Dashboard', onPress: () => router.push('/(tabs)') }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Membership Plans</Text>
          <Text style={styles.headerSubtitle}>Choose the perfect plan for your fitness journey</Text>
        </View>

        <View style={styles.plansContainer}>
          {plansData.map((plan, index) => (
            <View key={index} style={[styles.planCard, plan.popular && styles.popularCard]}>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}
              
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.duration}>/ {plan.duration}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.featuresList}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Text style={styles.featureIcon}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.payBtn, plan.popular && styles.popularPayBtn]}
                onPress={() => handlePurchase(plan)}
                disabled={processing !== null}
              >
                {processing === plan.name ? (
                  <ActivityIndicator color={plan.popular ? '#111' : '#fff'} />
                ) : (
                  <Text style={[styles.payBtnText, plan.popular && styles.popularPayBtnText]}>
                    {plan.freeTrial ? 'Claim Free Trial' : 'Pay Now'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  plansContainer: {
    gap: 24,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#F15A24',
    backgroundColor: 'rgba(241, 90, 36, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#F15A24',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  planSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 24,
  },
  currency: {
    color: '#F15A24',
    fontSize: 24,
    fontWeight: 'bold',
  },
  price: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  duration: {
    color: '#888',
    fontSize: 16,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  featuresList: {
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    color: '#F15A24',
    fontSize: 16,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    color: '#ccc',
    fontSize: 15,
  },
  payBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  popularPayBtn: {
    backgroundColor: '#F15A24',
  },
  payBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  popularPayBtnText: {
    color: '#fff',
  }
});
