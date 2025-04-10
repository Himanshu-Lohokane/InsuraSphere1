'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export type UserRole = 'user' | 'insurer' | 'admin';

interface UserProfile {
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  designation?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, role?: UserRole) => Promise<UserRole>;
  signUp: (email: string, password: string, role: UserRole, profile: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<UserRole>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user profile
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setUserProfile(profileDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string, role?: UserRole) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (profileDoc.exists()) {
      const profile = profileDoc.data() as UserProfile;
      setUserProfile(profile);
      return profile.role;
    }
    return role || 'user';
  };

  const signUp = async (email: string, password: string, role: UserRole, profile: Partial<UserProfile>) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile
    const userProfile: UserProfile = {
      role,
      name: profile?.name || '',
      email: result.user.email || '',
      phone: profile?.phone || '',
      company: profile?.company || '',
      designation: profile?.designation || '',
    };

    await setDoc(doc(db, 'users', result.user.uid), userProfile);
    setUserProfile(userProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const signInWithGoogle = async (role?: UserRole) => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user profile exists
    const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (!profileDoc.exists()) {
      // Create default user profile
      const userProfile: UserProfile = {
        role: role || 'user',
        name: result.user.displayName || '',
        email: result.user.email || '',
      };
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      setUserProfile(userProfile);
      return userProfile.role;
    } else {
      const profile = profileDoc.data() as UserProfile;
      setUserProfile(profile);
      return profile.role;
    }
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    if (!user || !userProfile) return;

    const updatedProfile: UserProfile = {
      ...userProfile,
      ...profile,
      role: profile.role || userProfile.role,
      name: profile.name || userProfile.name,
      email: profile.email || userProfile.email,
    };

    await setDoc(doc(db, 'users', user.uid), updatedProfile);
    setUserProfile(updatedProfile);
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    signInWithGoogle,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}