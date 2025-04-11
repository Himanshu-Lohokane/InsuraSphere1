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
  phone: string;
  address: string;
  dateOfBirth: string;
  familyMembers: number;
  income: number;
  occupation: string;
  company?: string;
  designation?: string;
  preferences?: {
    emailUpdates: boolean;
    notifications: boolean;
  };
}

// Add helper function to calculate age
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
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
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', { user: user?.email, uid: user?.uid });
      setUser(user);
      
      if (user) {
        try {
          console.log('Fetching user profile...');
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            console.log('User profile found:', profileData);
            setUserProfile(profileData);
          } else {
            console.log('No user profile found');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        console.log('No user, clearing profile');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, role?: UserRole) => {
    try {
      console.log('Signing in...', { email });
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', result.user.email);
      
      const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as UserProfile;
        console.log('Profile loaded:', profile);
        setUserProfile(profile);
        return profile.role;
      }
      return role || 'user';
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: UserRole, profile: Partial<UserProfile>) => {
    try {
      console.log('Signing up...', { email, role });
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Sign up successful:', result.user.email);
      
      const userProfile: UserProfile = {
        role,
        name: profile?.name || '',
        email: result.user.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        dateOfBirth: profile?.dateOfBirth || '',
        familyMembers: profile?.familyMembers || 0,
        income: profile?.income || 0,
        occupation: profile?.occupation || '',
        company: profile?.company || '',
        designation: profile?.designation || '',
        preferences: profile?.preferences || { emailUpdates: false, notifications: false },
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      console.log('Profile created:', userProfile);
      setUserProfile(userProfile);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await signOut(auth);
      setUserProfile(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
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
        phone: result.user.metadata.creationTime ? String(Math.floor(Math.random() * 10000000000) + 1000000000) : '',
        address: result.user.metadata.creationTime ? '123 Main St, Anytown, USA' : '',
        dateOfBirth: result.user.metadata.creationTime ? new Date(result.user.metadata.creationTime).toISOString().split('T')[0] : '',
        familyMembers: result.user.metadata.creationTime ? Math.floor(Math.random() * 5) + 1 : 1,
        income: result.user.metadata.creationTime ? Math.floor(Math.random() * 100000) : 0,
        occupation: result.user.metadata.creationTime ? 'Unemployed' : '',
        company: result.user.metadata.creationTime ? 'Acme Corp' : '',
        designation: result.user.metadata.creationTime ? 'Software Engineer' : '',
        preferences: result.user.metadata.creationTime ? { emailUpdates: true, notifications: true } : { emailUpdates: false, notifications: false },
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
      {children}
    </AuthContext.Provider>
  );
}