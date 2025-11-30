// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Initialize auth state properly
    const initializeAuth = async () => {
      await authService.initialize();
    };

    initializeAuth();

    // Listen for auth changes
    const handleAuthChange = (isAuthenticated, user) => {
      console.log('Auth state changed:', isAuthenticated, user);
      setIsLoggedIn(isAuthenticated);
      setCurrentUser(user);
      setAuthChecked(true);
    };

    authService.addAuthListener(handleAuthChange);

    return () => {
      authService.removeAuthListener(handleAuthChange);
    };
  }, []);

  const signOut = () => {
    authService.signOut();
  };

  return {
    isLoggedIn,
    currentUser,
    authChecked,
    signOut
  };
};