// src/hooks/useAuth.js - UPDATED
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize auth state properly
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        console.log('Initializing auth state...');
        const isAuthenticated = await authService.initialize();
        console.log('Auth initialization result:', isAuthenticated);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitializing(false);
        setAuthChecked(true);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const handleAuthChange = (isAuthenticated, user) => {
      console.log('useAuth: Auth state changed:', isAuthenticated, user);
      setIsLoggedIn(isAuthenticated);
      setCurrentUser(user);
      setAuthChecked(true);
    };

    authService.addAuthListener(handleAuthChange);

    return () => {
      authService.removeAuthListener(handleAuthChange);
    };
  }, []);

  const signOut = async () => {
    console.log('useAuth: signOut called');
    return new Promise((resolve) => {
      // Call authService.signOut which will notify listeners
      authService.signOut();
      console.log('useAuth: authService.signOut completed, waiting for state update...');
      // Wait for state updates to propagate
      setTimeout(() => {
        console.log('useAuth: State update delay complete, resolving');
        resolve();
      }, 200);
    });
  };

  return {
    isLoggedIn,
    currentUser,
    authChecked,
    isInitializing,
    signOut
  };
};