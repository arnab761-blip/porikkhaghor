import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut 
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  role: 'student' | 'assistant' | 'owner' | null;
  userData: any;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'assistant' | 'owner' | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or create user document in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          let currentRole = data.role || 'student';
          
          // Auto-upgrade if it's the admin email
          if (currentUser.email === 'geminioperator5@gmail.com' && currentRole !== 'owner') {
            currentRole = 'owner';
            await updateDoc(userRef, { role: 'owner' });
            data.role = 'owner';
          }
          
          setRole(currentRole);
          setUserData(data);
        } else {
          // New user, create document
          const isGuest = currentUser.isAnonymous;
          const newUserRole = currentUser.email === 'geminioperator5@gmail.com' ? 'owner' : 'student';
          const newUserData = {
            name: currentUser.displayName || (isGuest ? 'গেস্ট ইউজার' : 'নতুন ইউজার'),
            email: currentUser.email || null,
            role: newUserRole,
            isAnonymous: isGuest,
            createdAt: serverTimestamp(),
            unlockedExams: [],
            unlockedPackages: [],
            hasPaidAccess: false
          };
          await setDoc(userRef, newUserData);
          setRole(newUserRole);
          setUserData(newUserData);
        }
      } else {
        setRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest Sign-In Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, userData, loading, signInWithGoogle, signInAsGuest, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
