// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, database } from '../firebase/config';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [loginAttempts, setLoginAttempts] = useState({});

  // Constants
  const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Function to clear all storage and cache
  const clearAllStorage = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  // Function to check and update login attempts
  const checkLoginAttempts = (email) => {
    const attempts = loginAttempts[email] || { count: 0, timestamp: Date.now() };
    const timeDiff = Date.now() - attempts.timestamp;

    if (timeDiff > LOCKOUT_DURATION) {
      // Reset attempts if lockout duration has passed
      return true;
    }

    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      throw new Error(`Account temporarily locked. Please try again in ${Math.ceil((LOCKOUT_DURATION - timeDiff) / 60000)} minutes.`);
    }

    return true;
  };

  // Function to update user's last active timestamp in database
  const updateUserActivity = async (uid) => {
    try {
      await set(ref(database, `users/${uid}/lastActive`), serverTimestamp());
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  };

  // Auto logout after inactivity
  useEffect(() => {
    const handleActivity = () => {
      const newTime = Date.now();
      setLastActivity(newTime);
      if (currentUser?.uid) {
        updateUserActivity(currentUser.uid);
      }
    };

    const checkInactivity = () => {
      if (currentUser && Date.now() - lastActivity > INACTIVE_TIMEOUT) {
        logout();
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, handleActivity));

    const intervalId = setInterval(checkInactivity, 60 * 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(intervalId);
    };
  }, [currentUser, lastActivity]);

  async function login(email, password) {
    try {
      // Check login attempts
      if (!checkLoginAttempts(email)) {
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data from database
      const userRef = ref(database, `users/${userCredential.user.uid}`);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        console.error("No user data found in database");
        await signOut(auth);
        await clearAllStorage();
        throw new Error('User not found in database');
      }
      
      const userData = snapshot.val();
      if (!userData.role) {
        console.error("No role found for user");
        await signOut(auth);
        await clearAllStorage();
        throw new Error('User role not found');
      }

      // Update user status in database
      await set(ref(database, `users/${userCredential.user.uid}/status`), {
        lastLogin: serverTimestamp(),
        loginIP: await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip),
        userAgent: navigator.userAgent
      });
      
      // Reset login attempts on successful login
      setLoginAttempts(prev => ({
        ...prev,
        [email]: { count: 0, timestamp: Date.now() }
      }));

      setUserRole(userData.role);
      setCurrentUser({
        ...userCredential.user,
        role: userData.role
      });
      setLastActivity(Date.now());
      return userCredential;
    } catch (error) {
      // Increment login attempts on failure
      setLoginAttempts(prev => ({
        ...prev,
        [email]: {
          count: (prev[email]?.count || 0) + 1,
          timestamp: Date.now()
        }
      }));
      console.error('Login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (currentUser?.uid) {
        // Update user status in database
        await set(ref(database, `users/${currentUser.uid}/status/lastLogout`), serverTimestamp());
      }
      await clearAllStorage();
      await signOut(auth);
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Check if user is active/not blocked
            if (userData.status === 'blocked') {
              await signOut(auth);
              await clearAllStorage();
              throw new Error('Account has been blocked. Please contact administrator.');
            }

            setUserRole(userData.role);
            setCurrentUser({
              ...user,
              role: userData.role
            });
            setLastActivity(Date.now());
          } else {
            console.error("No user data found during auth state change");
            await signOut(auth);
            await clearAllStorage();
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          await signOut(auth);
          await clearAllStorage();
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        await clearAllStorage();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearAllStorage();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    loading,
    isAuthenticated: !!currentUser,
    isSuperAdmin: userRole === 'superadmin',
    isHealthCampAdmin: userRole === 'health-camp-admin',
    isIndividualCampAdmin: userRole === 'individual-camp-admin',
    lastActivity
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}