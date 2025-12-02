// src/services/auth.js - UPDATED WITH PERSISTENCE
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
          username: response.data.username,
          email: response.data.email
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
          username: response.data.username,
          email: response.data.email
        };
        setCurrentUser(user);
        console.log('Sign in successful, token set');
        this.notifyAuthChange(true, user);
        return response.data;
      } else {
        throw new Error('No access token received from server');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw 'Invalid username or password';
      } else if (error.response?.status === 404) {
        throw 'User does not exist';
      } else if (error.response?.data?.error) {
        throw error.response.data.error;
      } else if (error.formattedMessage) {
        throw error.formattedMessage;
      } else {
        throw 'Login failed. Please try again.';
      }
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

  // Validate token - with localStorage check
  async validateToken() {
    try {
      const token = getAuthToken();
      const currentUser = getCurrentUser();
      
      // Check localStorage for web persistence
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
        // For other errors (like network issues), don't sign out
        // Just notify as not authenticated temporarily
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
    console.log('Initializing auth service...');
    
    // Clear any demo data first
    this.clearDemoData();
    
    // Check if we have stored auth data
    const token = getAuthToken();
    const user = getCurrentUser();
    
    if (token && user) {
      console.log('Found stored auth data, validating...');
      return await this.validateToken();
    } else {
      console.log('No stored auth data found');
      this.notifyAuthChange(false, null);
      return false;
    }
  },

  // Event listener methods
  addAuthListener(callback) {
    authListeners.add(callback);
  },

  removeAuthListener(callback) {
    authListeners.delete(callback);
  },

  notifyAuthChange(isAuthenticated, user) {
    console.log('Auth state changed:', isAuthenticated, user);
    authListeners.forEach(callback => {
      try {
        callback(isAuthenticated, user);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }
};