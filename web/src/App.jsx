import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import React, { useEffect, Suspense, lazy } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Import our stats scheduler
import statsScheduler from './services/statsScheduler';

// Import InstallPrompt component
import InstallPrompt from './Components/InstallPrompt/InstallPrompt';

import LoadingRunner from './Components/LoadingRunner/LoadingRunner';
import SwipeableLayout from './Components/SwipeableLayout/SwipeableLayout';
import TabManager from './Components/SwipeableLayout/TabManager';

const Home = lazy(() => import('./Components/Home'));
const EventsPage = lazy(() => import('./Components/EventsPage'));
const SignIn = lazy(() => import('./Components/SignIn/SignIn'));
const SignUp = lazy(() => import('./Components/SignUp/SignUp'));
const Dashboard = lazy(() => import('./Components/Dashboard/Dashboard'));
const Community = lazy(() => import('./Components/Community/Community'));
const Profile = lazy(() => import('./Components/Profile/Profile'));
const Admin = lazy(() => import('./Components/admin/admin'));
const QRScanner = lazy(() => import('./Components/admin/QRScanner'));
const QRInfo = lazy(() => import('./Components/admin/QRInfo'));
const Payments = lazy(() => import('./Components/Payments/Payments'));
const UserEventsPage = lazy(() => import('./Components/UserEventsPage/UserEventsPage'));
const NotificationsPage = lazy(() => import('./Components/Notifications/NotificationsPage'));
const TicketVerification = lazy(() => import('./Components/TicketVerification/TicketVerification'));
const PlansPage = lazy(() => import('./Components/Plans/PlansPage'));
const FitnessTracker = lazy(() => import('./Components/FitnessTracker/FitnessTracker'));
const PrivacyPolicy = lazy(() => import('./Components/PrivacyPolicy/PrivacyPolicy'));
const Terms = lazy(() => import('./Components/TermsOfService/Terms'));
const RefundPolicy = lazy(() => import('./Components/RefundPolicy/RefundPolicy'));
const FAQ = lazy(() => import('./Components/FAQ/FAQ'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--darkGrey)',
          color: 'white',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1>Oops! Something went wrong</h1>
          <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: 'var(--orange)',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Add auth state listener to clear any cached data when auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Global auth state changed:', user ? user.uid : 'No user');
      if (!user) {
        // Clear any cached data when user logs out
        localStorage.removeItem('currentUser');
        localStorage.removeItem('eventBookings');
        localStorage.removeItem('eventParticipants');
      }
    });
    
    // Add default "Weekly Community Run" event if it doesn't exist
    const addDefaultEvent = async () => {
      try {
        // Check if the event already exists
        const eventsRef = collection(db, 'upcomingEvents');
        const q = query(eventsRef, where('name', '==', 'Weekly Community Run'));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // Add the default event
          const defaultEvent = {
            name: 'Weekly Community Run',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
            time: '07:00 AM',
            location: 'C3 Cafe, City Park',
            description: 'Join fellow runners for an unforgettable experience.',
            participants: 25,
            maxParticipants: 50,
            status: 'Open for Registration'
          };
          
          const docRef = await addDoc(collection(db, 'upcomingEvents'), defaultEvent);
          console.log('Default event added with ID:', docRef.id);
        } else {
          console.log('Default event already exists');
        }
      } catch (error) {
        console.error('Error adding default event:', error);
      }
    };
    
    // Run the function to add default event
    addDefaultEvent();
    
    // Start the stats scheduler when the app loads
    statsScheduler.start(60); // Run every 60 minutes (original frequency)
    
    // Cleanup function to stop the scheduler when the component unmounts
    return () => {
      unsubscribe();
      statsScheduler.stop();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <InstallPrompt />
        <Suspense fallback={<LoadingRunner />}>
          <SwipeableLayout>
            <TabManager />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/SignIn" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Tab routes are now handled by TabManager but we keep them here with null element to prevent React Router 'No match' warnings */}
              <Route path="/dashboard" element={null} />
              <Route path="/community" element={null} />
              <Route path="/user-events" element={null} />
              <Route path="/plans" element={null} />
              <Route path="/fitness" element={null} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/qr-scanner" element={<QRScanner />} />
              <Route path="/qr-info" element={<QRInfo />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/ticket" element={<TicketVerification />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/faq" element={<FAQ />} />
            </Routes>
          </SwipeableLayout>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;