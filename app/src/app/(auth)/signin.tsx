import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, app } from '../../config/firebase';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaVerifier = useRef(null);
  const router = useRouter();
  
  // Use the Firebase config from the app instance
  const firebaseConfig = app ? app.options : {};

  const handleSendOTP = async () => {
    try {
      setError('');
      setLoading(true);
      
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        '+91' + phoneNumber,
        recaptchaVerifier.current
      );
      setVerificationId(verificationId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setError('');
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      // AuthContext will handle the redirect to (tabs) automatically
    } catch (err: any) {
      console.error(err);
      setError('Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification={true}
      />
      
      <View style={styles.card}>
        <Text style={styles.title}>R&D Login</Text>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        {!verificationId ? (
          <>
            <Text style={styles.label}>MOBILE NUMBER</Text>
            <View style={styles.phoneContainer}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="ENTER YOUR NUMBER"
                placeholderTextColor="#666"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
              />
            </View>
            <TouchableOpacity 
              style={[styles.button, (!phoneNumber || phoneNumber.length !== 10) && styles.buttonDisabled]} 
              onPress={handleSendOTP}
              disabled={loading || phoneNumber.length !== 10}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>ENTER OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              value={verificationCode}
              onChangeText={setVerificationCode}
              maxLength={6}
            />
            <TouchableOpacity 
              style={[styles.button, verificationCode.length !== 6 && styles.buttonDisabled]} 
              onPress={handleVerifyOTP}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setVerificationId('')}>
              <Text style={styles.linkText}>Back to Phone Number</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(40, 40, 40, 0.8)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#F15A24',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  prefix: {
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#F15A24',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(241, 90, 36, 0.5)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  linkText: {
    color: '#F15A24',
    marginTop: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
