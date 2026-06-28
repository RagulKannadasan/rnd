import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../config/firebase';
import { updateProfile, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    age: '',
    profession: '',
    fitnessLevel: 'beginner',
    gender: '',
    dateOfBirth: '',
    emergencyContact: '',
    instagram: '',
    goals: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
          
          const res = await fetch(`${apiUrl}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          let userData: any = {};
          if (res.ok) {
            const data = await res.json();
            userData = data.profile || {};
          }
          
          setFormData({
            displayName: auth.currentUser.displayName || userData.displayName || '',
            email: auth.currentUser.email || userData.email || '',
            phone: auth.currentUser.phoneNumber || userData.phone || '',
            age: userData.age || '',
            profession: userData.profession || '',
            fitnessLevel: userData.fitnessLevel || 'beginner',
            gender: userData.gender || '',
            dateOfBirth: userData.dateOfBirth || '',
            emergencyContact: userData.emergencyContact || '',
            instagram: userData.instagram || '',
            goals: Array.isArray(userData.goals) ? userData.goals.join(', ') : '',
          });
        } catch (err) {
          console.error('Error fetching user data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      if (formData.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName
        });
      }
      const token = await auth.currentUser.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      
      const payload = {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone || '',
        age: formData.age || '',
        profession: formData.profession || '',
        fitnessLevel: formData.fitnessLevel || 'beginner',
        gender: formData.gender || '',
        dateOfBirth: formData.dateOfBirth || '',
        emergencyContact: formData.emergencyContact || '',
        instagram: formData.instagram || '',
        goals: formData.goals.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0)
      };
      
      const res = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to update profile via API');
      
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete your account? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;
              
              await deleteUser(currentUser);
              const userDocRef = doc(db, 'users', currentUser.uid);
              await deleteDoc(userDocRef);
              
              router.replace('/(auth)/signin');
            } catch (error: any) {
              console.error("Error deleting account:", error);
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert("Error", "This is a sensitive operation and requires you to have signed in recently. Please sign out and sign back in.");
              } else {
                Alert.alert("Error", "Failed to delete account. Please try again.");
              }
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F15A24" />
      </View>
    );
  }

  const renderField = (label: string, field: keyof typeof formData, placeholder: string, keyboardType: any = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={formData[field]}
          onChangeText={(text) => setFormData(prev => ({...prev, [field]: text}))}
          placeholder={placeholder}
          placeholderTextColor="#666"
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={styles.value}>{formData[field] || 'Not provided'}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Details</Text>
        {renderField('Display Name', 'displayName', 'Enter your name')}
        {renderField('Email', 'email', 'Enter your email', 'email-address')}
        {renderField('Phone', 'phone', 'Enter your phone', 'phone-pad')}
        {renderField('Gender', 'gender', 'Male/Female/Other')}
        {renderField('Date of Birth', 'dateOfBirth', 'YYYY-MM-DD')}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fitness Information</Text>
        {renderField('Age', 'age', 'Enter your age', 'numeric')}
        {renderField('Profession', 'profession', 'Enter your profession')}
        {renderField('Fitness Level', 'fitnessLevel', 'Beginner/Intermediate/Advanced')}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Social & Emergency</Text>
        {renderField('Instagram', 'instagram', 'Enter Instagram username')}
        {renderField('Emergency Contact', 'emergencyContact', 'Enter emergency contact phone', 'phone-pad')}
        {renderField('Goals', 'goals', 'Enter goals (comma separated)')}
      </View>

      <View style={[styles.card, styles.achievementsCard]}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementIcon}>🏃‍♂️</Text>
            <View>
              <Text style={styles.achievementTitle}>First Run</Text>
              <Text style={styles.achievementStatus}>Completed</Text>
            </View>
          </View>
          <View style={styles.achievementItem}>
            <Text style={styles.achievementIcon}>🏅</Text>
            <View>
              <Text style={styles.achievementTitle}>5K Club</Text>
              <Text style={styles.achievementStatusPending}>In Progress</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Settings & Legal</Text>
        <TouchableOpacity style={styles.navLink} onPress={() => router.push('/notifications')}>
          <Text style={styles.navLinkText}>Notifications</Text>
          <Text style={styles.navLinkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => router.push('/privacy')}>
          <Text style={styles.navLinkText}>Privacy Policy</Text>
          <Text style={styles.navLinkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => router.push('/terms')}>
          <Text style={styles.navLinkText}>Terms of Service</Text>
          <Text style={styles.navLinkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navLink} onPress={() => router.push('/faq')}>
          <Text style={styles.navLinkText}>FAQ</Text>
          <Text style={styles.navLinkArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {!isEditing && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      )}

      {isEditing && (
        <View style={[styles.card, styles.dangerZone]}>
          <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
          <Text style={styles.dangerDesc}>Once you delete your account, there is no going back. Please be certain.</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: '#888',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  editBtnText: {
    color: '#F15A24',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtnText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#F15A24',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  label: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    padding: 0,
  },
  dangerZone: {
    borderColor: 'rgba(255, 68, 68, 0.3)',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  dangerText: {
    color: '#ff4444',
  },
  dangerDesc: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ff4444',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  navLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navLinkText: {
    color: '#fff',
    fontSize: 16,
  },
  navLinkArrow: {
    color: '#666',
    fontSize: 16,
  },
  achievementsCard: {
    backgroundColor: 'rgba(241, 90, 36, 0.05)',
    borderColor: 'rgba(241, 90, 36, 0.2)',
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: 140,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  achievementStatus: {
    color: '#00ff88',
    fontSize: 12,
  },
  achievementStatusPending: {
    color: '#F15A24',
    fontSize: 12,
  }
});
