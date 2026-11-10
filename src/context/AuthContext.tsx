import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../firebase/config';
import { Business, UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  activeBusiness: Business | null;
  userBusinesses: Business[];
  isSuperAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setActiveBusinessId: (businessId: string) => Promise<void>;
  createBusiness: (businessData: Omit<Business, 'id' | 'ownerId' | 'plan' | 'planStatus' | 'createdAt'>) => Promise<Business>;
  updateActiveBusiness: (updatedData: Partial<Business>) => Promise<void>;
  clearAuthError: () => void;
  enterDemoMode: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAIL = 'abdulwasiukura@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL || userProfile?.role === 'admin';

  // Run initial connectivity check
  useEffect(() => {
    testConnection();
  }, []);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      startTransition(() => {
        setCurrentUser(user);
      });
      if (user) {
        setIsDemoMode(false);
        await loadUserData(user);
      } else {
        setUserProfile(null);
        setActiveBusiness(null);
        setUserBusinesses([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (user: User) => {
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let profile: UserProfile;

      if (!userSnap.exists()) {
        profile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Business Owner',
          phone: user.phoneNumber || '',
          role: user.email === SUPER_ADMIN_EMAIL ? 'admin' : 'owner',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, {
          ...profile,
          timestamp: serverTimestamp(),
        });
      } else {
        profile = userSnap.data() as UserProfile;
      }
      setUserProfile(profile);

      // Fetch user's businesses
      await loadBusinesses(user.uid, profile.activeBusinessId);
    } catch (err) {
      console.error('Error loading user profile:', err);
      try {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } catch {
        setAuthError('Could not sync user profile with database.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadBusinesses = async (userId: string, preferredBusinessId?: string) => {
    try {
      const q = query(collection(db, 'businesses'), where('ownerId', '==', userId));
      const querySnap = await getDocs(q);

      const businesses: Business[] = [];
      querySnap.forEach((docSnap) => {
        businesses.push({ id: docSnap.id, ...docSnap.data() } as Business);
      });

      setUserBusinesses(businesses);

      if (businesses.length > 0) {
        let chosen = businesses.find((b) => b.id === preferredBusinessId);
        if (!chosen) {
          chosen = businesses[0];
        }
        setActiveBusiness(chosen);
      } else {
        setActiveBusiness(null);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      try {
        handleFirestoreError(err, OperationType.LIST, 'businesses');
      } catch {
        setAuthError('Could not load businesses. Please verify network or credentials.');
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setAuthError(msg.replace('Firebase: ', ''));
      setIsLoading(false);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string, phone?: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(res.user, { displayName });

      const newProfile: UserProfile = {
        id: res.user.uid,
        email: email.trim(),
        displayName,
        phone: phone || '',
        role: email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'owner',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', res.user.uid), {
        ...newProfile,
        timestamp: serverTimestamp(),
      });
      setUserProfile(newProfile);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setAuthError(msg.replace('Firebase: ', ''));
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in cancelled or failed';
      setAuthError(msg.replace('Firebase: ', ''));
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await signOut(auth);
      setIsDemoMode(false);
      setCurrentUser(null);
      setUserProfile(null);
      setActiveBusiness(null);
      setUserBusinesses([]);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveBusinessId = async (businessId: string) => {
    const selected = userBusinesses.find((b) => b.id === businessId);
    if (selected) {
      setActiveBusiness(selected);
      if (currentUser) {
        try {
          await setDoc(
            doc(db, 'users', currentUser.uid),
            { activeBusinessId: businessId },
            { merge: true }
          );
        } catch (err) {
          console.warn('Failed to update active business on profile', err);
        }
      }
    }
  };

  const createBusiness = async (
    data: Omit<Business, 'id' | 'ownerId' | 'plan' | 'planStatus' | 'createdAt'>
  ): Promise<Business> => {
    if (!currentUser && !isDemoMode) {
      throw new Error('Must be signed in to register a business.');
    }

    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ownerId = currentUser ? currentUser.uid : 'demo_owner_101';

    const newBusiness: Business = {
      ...data,
      id: businessId,
      ownerId,
      plan: 'growth',
      planStatus: 'active',
      currency: '₦',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(doc(db, 'businesses', businessId), {
          ...newBusiness,
          timestamp: serverTimestamp(),
        });

        // Set owner as member in subcollection
        await setDoc(doc(db, `businesses/${businessId}/members`, currentUser.uid), {
          userId: currentUser.uid,
          role: 'owner',
          email: currentUser.email || '',
          joinedAt: new Date().toISOString(),
        });

        // Update user profile default business
        await setDoc(
          doc(db, 'users', currentUser.uid),
          { activeBusinessId: businessId },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}`);
      }
    }

    setUserBusinesses((prev) => [...prev, newBusiness]);
    setActiveBusiness(newBusiness);
    return newBusiness;
  };

  const updateActiveBusiness = async (updatedData: Partial<Business>) => {
    if (!activeBusiness) return;
    const updated = {
      ...activeBusiness,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        await setDoc(
          doc(db, 'businesses', activeBusiness.id),
          { ...updatedData, updatedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `businesses/${activeBusiness.id}`);
      }
    }

    setActiveBusiness(updated);
    setUserBusinesses((prev) =>
      prev.map((b) => (b.id === activeBusiness.id ? updated : b))
    );
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    const demoBiz: Business = {
      id: 'biz_demo_albarakah',
      name: 'Al-Barakah Supermart & Wholesale',
      tagline: 'Quality Household & Consumer Provisions',
      cacNumber: 'RC-1849204',
      tin: '24910482-0001',
      phone: '+234 803 892 4110',
      email: 'info@albarakahmart.ng',
      address: 'Plot 42, Ahmadu Bello Way, Central District',
      city: 'Kano',
      state: 'Kano',
      currency: '₦',
      ownerId: 'demo_owner_101',
      plan: 'growth',
      planStatus: 'active',
      receiptFooter: 'Thank you for shopping with Al-Barakah! Excellence in Every Service.',
      createdAt: new Date().toISOString(),
    };

    setActiveBusiness(demoBiz);
    setUserBusinesses([demoBiz]);
    setUserProfile({
      id: 'demo_owner_101',
      displayName: 'Alhaji Danladi Usman',
      email: 'danladi.usman@albarakahmart.ng',
      phone: '+234 803 892 4110',
      role: 'owner',
      activeBusinessId: demoBiz.id,
      createdAt: new Date().toISOString(),
    });
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeBusiness,
        userBusinesses,
        isSuperAdmin,
        isLoading,
        authError,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        setActiveBusinessId,
        createBusiness,
        updateActiveBusiness,
        clearAuthError: () => setAuthError(null),
        enterDemoMode,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
