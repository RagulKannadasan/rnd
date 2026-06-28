import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  Alert
} from 'react-native';

import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';

export default function FitnessScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'workouts' | 'meals'>('workouts');
  const [loading, setLoading] = useState(false);
  const [fetchingApi, setFetchingApi] = useState(false);

  // Workout State
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: 'cardio',
    duration: '',
    calories: '',
    distance: ''
  });

  // Meal State
  const [meals, setMeals] = useState<any[]>([]);
  const [newMeal, setNewMeal] = useState({
    name: '',
    quantity: '100',
    unit: 'grams',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast'
  });

  useEffect(() => {
    if (user) {
      loadWorkouts();
      loadMeals();
    }
  }, [user]);

  const loadWorkouts = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      const res = await fetch(`${apiUrl}/api/fitness/workouts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setWorkouts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadMeals = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      const res = await fetch(`${apiUrl}/api/fitness/meals`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMeals(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // --- API Integrations ---
  const fetchCaloriesBurned = async () => {
    if (!newWorkout.name.trim() || !newWorkout.duration) return;
    setFetchingApi(true);
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      
      const response = await fetch(`${apiUrl}/api/ai/calories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWorkout.name,
          type: newWorkout.type,
          duration: newWorkout.duration
        })
      });
      
      const data = await response.json();
      
      if (data.calories) {
        setNewWorkout(prev => ({ ...prev, calories: data.calories }));
      } else {
        throw new Error('No calories returned');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not calculate calories. Enter manually.');
    } finally {
      setFetchingApi(false);
    }
  };

  const fetchNutritionData = async () => {
    if (!newMeal.name.trim() || !newMeal.quantity) return;
    setFetchingApi(true);
    
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      
      const response = await fetch(`${apiUrl}/api/ai/nutrition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newMeal.name,
          quantity: newMeal.quantity
        })
      });
      
      const data = await response.json();
      
      if (data.calories) {
        setNewMeal(prev => ({
          ...prev,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        }));
      } else {
        throw new Error('Invalid nutrition data');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch nutrition data.');
    } finally {
      setFetchingApi(false);
    }
  };

  // --- Submission ---
  const handleLogWorkout = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      const res = await fetch(`${apiUrl}/api/fitness/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...newWorkout,
          duration: parseInt(newWorkout.duration) || 0,
          calories: parseInt(newWorkout.calories) || 0,
          distance: parseFloat(newWorkout.distance) || 0
        })
      });
      if (res.ok) {
        setNewWorkout({ name: '', type: 'cardio', duration: '', calories: '', distance: '' });
        loadWorkouts();
        Alert.alert('Success', 'Workout logged successfully!');
      } else {
        throw new Error('Failed to log');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to log workout');
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      const res = await fetch(`${apiUrl}/api/fitness/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...newMeal,
          calories: parseInt(newMeal.calories) || 0,
          protein: parseInt(newMeal.protein) || 0,
          carbs: parseInt(newMeal.carbs) || 0,
          fat: parseInt(newMeal.fat) || 0
        })
      });
      if (res.ok) {
        setNewMeal({ name: '', quantity: '100', unit: 'grams', calories: '', protein: '', carbs: '', fat: '', mealType: 'breakfast' });
        loadMeals();
        Alert.alert('Success', 'Meal logged successfully!');
      } else {
        throw new Error('Failed to log');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to log meal');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string, type: 'workouts' | 'meals') => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';
      const res = await fetch(`${apiUrl}/api/fitness/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (type === 'workouts') loadWorkouts();
        else loadMeals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fitness Tracker</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'workouts' && styles.activeTabBtn]}
          onPress={() => setActiveTab('workouts')}
        >
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>Workouts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'meals' && styles.activeTabBtn]}
          onPress={() => setActiveTab('meals')}
        >
          <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>Meals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'workouts' ? (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Log New Workout</Text>
              
              <TextInput style={styles.input} placeholder="Workout Name (e.g. Morning Run)" placeholderTextColor="#666" value={newWorkout.name} onChangeText={t => setNewWorkout({...newWorkout, name: t})} />
              
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Duration (min)" placeholderTextColor="#666" keyboardType="numeric" value={newWorkout.duration} onChangeText={t => setNewWorkout({...newWorkout, duration: t})} />
                <TouchableOpacity style={styles.aiBtn} onPress={fetchCaloriesBurned} disabled={fetchingApi}>
                  <Text style={styles.aiBtnText}>{fetchingApi ? 'Calc...' : '✨ AI Calc'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Calories" placeholderTextColor="#666" keyboardType="numeric" value={newWorkout.calories} onChangeText={t => setNewWorkout({...newWorkout, calories: t})} />
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Distance (km)" placeholderTextColor="#666" keyboardType="numeric" value={newWorkout.distance} onChangeText={t => setNewWorkout({...newWorkout, distance: t})} />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleLogWorkout} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log Workout</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts.map(w => (
              <View key={w.id} style={styles.historyCard}>
                <View style={{flex: 1}}>
                  <Text style={styles.historyTitle}>{w.name}</Text>
                  <Text style={styles.historySubtitle}>{w.duration} min • {w.calories} cal {w.distance > 0 ? `• ${w.distance} km` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteItem(w.id, 'workouts')}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Log New Meal</Text>
              
              <TextInput style={styles.input} placeholder="Food Name (e.g. Oatmeal)" placeholderTextColor="#666" value={newMeal.name} onChangeText={t => setNewMeal({...newMeal, name: t})} />
              
              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Quantity (g)" placeholderTextColor="#666" keyboardType="numeric" value={newMeal.quantity} onChangeText={t => setNewMeal({...newMeal, quantity: t})} />
                <TouchableOpacity style={styles.aiBtn} onPress={fetchNutritionData} disabled={fetchingApi}>
                  <Text style={styles.aiBtnText}>{fetchingApi ? 'Calc...' : '✨ AI Macros'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Cals" placeholderTextColor="#666" keyboardType="numeric" value={newMeal.calories} onChangeText={t => setNewMeal({...newMeal, calories: t})} />
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Pro (g)" placeholderTextColor="#666" keyboardType="numeric" value={newMeal.protein} onChangeText={t => setNewMeal({...newMeal, protein: t})} />
              </View>

              <View style={styles.row}>
                <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Carbs (g)" placeholderTextColor="#666" keyboardType="numeric" value={newMeal.carbs} onChangeText={t => setNewMeal({...newMeal, carbs: t})} />
                <TextInput style={[styles.input, {flex: 1}]} placeholder="Fat (g)" placeholderTextColor="#666" keyboardType="numeric" value={newMeal.fat} onChangeText={t => setNewMeal({...newMeal, fat: t})} />
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleLogMeal} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log Meal</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Recent Meals</Text>
            {meals.map(m => (
              <View key={m.id} style={styles.historyCard}>
                <View style={{flex: 1}}>
                  <Text style={styles.historyTitle}>{m.name}</Text>
                  <Text style={styles.historySubtitle}>{m.calories} cal • {m.protein}g P • {m.carbs}g C • {m.fat}g F</Text>
                </View>
                <TouchableOpacity onPress={() => deleteItem(m.id, 'meals')}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(241, 90, 36, 0.2)',
    borderWidth: 1,
    borderColor: '#F15A24',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#F15A24',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 32,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  aiBtn: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiBtnText: {
    color: '#00ff88',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#F15A24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historySubtitle: {
    color: '#F15A24',
    fontSize: 14,
  },
  deleteText: {
    color: '#666',
    fontSize: 20,
    padding: 8,
  }
});
