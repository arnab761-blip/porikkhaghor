import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
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
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
            phone: (currentUser as any).phoneNumber || null,
            role: newUserRole,
            isAnonymous: isGuest,
            createdAt: serverTimestamp(),
            unlockedExams: [],
            unlockedPackages: [],
            unlockedResources: [],
            hasPaidAccess: false
          };
          await setDoc(userRef, newUserData, { merge: true });
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

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error) {
      console.error("Email Sign-In Error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      const userRef = doc(db, 'users', cred.user.uid);
      const newUserRole = email.trim() === 'geminioperator5@gmail.com' ? 'owner' : 'student';
      const newUserData = {
        name: name.trim() || 'নতুন ইউজার',
        email: email.trim(),
        phone: phone.trim() || null,
        role: newUserRole,
        isAnonymous: false,
        createdAt: serverTimestamp(),
        unlockedExams: [],
        unlockedPackages: [],
        unlockedResources: [],
        hasPaidAccess: false
      };
      await setDoc(userRef, newUserData, { merge: true });
      setRole(newUserRole);
      setUserData(newUserData);
    } catch (error) {
      console.error("Email Sign-Up Error:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      console.error("Password Reset Error:", error);
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
    <AuthContext.Provider value={{ 
      user, 
      role, 
      userData, 
      loading, 
      signInWithGoogle, 
      signInAsGuest, 
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout 
    }}>
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
