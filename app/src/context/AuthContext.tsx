import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let userData = {};
          if (userDoc.exists()) {
            userData = userDoc.data();
          }

          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || userData.displayName || 'User',
            email: firebaseUser.email || userData.email,
            phone: firebaseUser.phoneNumber || userData.phoneNumber,
            photoURL: firebaseUser.photoURL,
            getIdToken: () => firebaseUser.getIdToken(),
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email,
            getIdToken: () => firebaseUser.getIdToken(),
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
