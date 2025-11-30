// src/services/auth.js
import api, { setAuthToken, getAuthToken, setCurrentUser, getCurrentUser } from './api';

// Create an event emitter for auth state changes
const authListeners = new Set();

export const authService = {
  // Sign Up
  async signUp(userData) {
    try {
      console.log('Attempting sign up with:', { 
        username: userData.username, 
        email: userData.email 
      });
      
      const response = await api.post('/auth/register/', {
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      
      console.log('Sign up response:', response.data);
      
      if (response.data.access) {
        setAuthToken(response.data.access);
        const user = {
          id: response.data.user_id,
          username: response.data.username
        };
        setCurrentUser(user);
        console.log('Sign up successful, token set');
        this.notifyAuthChange(true, user);
      }
      return response.data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Sign In
  async signIn(credentials) {
    try {
      console.log('Attempting sign in with:', { username: credentials.username });
      
      const response = await api.post('/auth/login/', {
        username: credentials.username,
        password: credentials.password
      });
      
      console.log('Sign in response:', response.data);
      
      if (response.data.access) {
        setAuthToken(response.data.access);
        const user = {
          id: response.data.user_id,
          username: response.data.username // FIXED: was response.username, should be response.data.username
        };
        setCurrentUser(user);
        console.log('Sign in successful, token set');
        this.notifyAuthChange(true, user);
      }
      return response.data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Sign Out
  signOut() {
    setAuthToken(null);
    setCurrentUser(null);
    console.log('Signed out');
    this.notifyAuthChange(false, null);
  },

  // Get current user
  getCurrentUser() {
    return getCurrentUser();
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = getAuthToken();
    const user = getCurrentUser();
    const isAuth = !!(token && user);
    console.log('Auth check - Token:', !!token, 'User:', !!user, 'IsAuth:', isAuth);
    return isAuth;
  },

  // Get auth token
  getToken() {
    return getAuthToken();
  },

  // Validate token - FIXED: Don't automatically set user data
  async validateToken() {
    try {
      const token = getAuthToken();
      const currentUser = getCurrentUser();
      
      if (!token || !currentUser) {
        this.notifyAuthChange(false, null);
        return false;
      }
      
      // Make a simple API call to validate the token
      const response = await api.get('/playlists/');
      
      // Only notify if we're still authenticated
      if (response.status === 200) {
        this.notifyAuthChange(true, currentUser);
        return true;
      } else {
        this.signOut();
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      // If token is invalid, clear it
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.signOut();
      } else {
        // For other errors, don't automatically sign out, just notify as not authenticated
        this.notifyAuthChange(false, null);
      }
      return false;
    }
  },

  // Clear any demo/pre-set user data
  clearDemoData() {
    // Clear any stored demo user data
    const token = getAuthToken();
    const user = getCurrentUser();
    
    // If there's a user but no token, it's likely demo data
    if (user && !token) {
      console.log('Clearing demo user data');
      setCurrentUser(null);
      this.notifyAuthChange(false, null);
    }
  },

  // Initialize auth state - call this when app starts
  async initialize() {
    // Clear any demo data first
    this.clearDemoData();
    
    // Then validate token if exists
    return await this.validateToken();
  },

  // Event listener methods
  addAuthListener(callback) {
    authListeners.add(callback);
  },

  removeAuthListener(callback) {
    authListeners.delete(callback);
  },

  notifyAuthChange(isAuthenticated, user) {
    authListeners.forEach(callback => {
      try {
        callback(isAuthenticated, user);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }
};