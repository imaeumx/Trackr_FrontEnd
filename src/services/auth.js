// src/services/auth.js - UPDATED WITH PERSISTENCE
import api, { setAuthToken, getAuthToken, setCurrentUser, getCurrentUser } from './api';
import { playlistService } from './playlistService';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        // Persist auth on native platforms
        try {
          if (Platform.OS !== 'web') {
            await AsyncStorage.setItem('trackr_auth_token', response.data.access);
            await AsyncStorage.setItem('trackr_user', JSON.stringify(user));
          }
        } catch (err) {
          console.warn('Failed to persist auth on signup:', err);
        }
        console.log('Sign up successful, token set');

        // NOTE: Default playlists creation disabled - new users start with 0 playlists
        // try {
        //   await this.createDefaultPlaylists(user.id);
        // } catch (err) {
        //   console.error('Failed to create default playlists after signup:', err);
        // }

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
        // Persist auth on native platforms
        try {
          if (Platform.OS !== 'web') {
            await AsyncStorage.setItem('trackr_auth_token', response.data.access);
            await AsyncStorage.setItem('trackr_user', JSON.stringify(user));
          }
        } catch (err) {
          console.warn('Failed to persist auth on signIn:', err);
        }
        console.log('Sign in successful, token set');

        // Check if user has any playlists, if not, create default ones
        try {
          const playlists = await playlistService.getPlaylists();
          const playlistsArray = Array.isArray(playlists) ? playlists : (playlists.results || []);
          if (playlistsArray.length === 0) {
            console.log('User has no playlists, creating default ones...');
            await this.createDefaultPlaylists(user.id);
          }
        } catch (err) {
          console.error('Error checking/creating default playlists:', err);
        }

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

  // Create default playlists for new user
  async createDefaultPlaylists(userId) {
    try {
      console.log('Creating default playlists for user:', userId);
      
      const defaultPlaylists = [
        {
          title: "Watchlist",
          description: "Movies and series I want to watch"
        },
        {
          title: "Favorites",
          description: "My all-time favorite movies and series"
        },
        {
          title: "Watched",
          description: "Movies and series I've already watched"
        }
      ];
      
      // Create each default playlist
      for (const playlistData of defaultPlaylists) {
        try {
          await playlistService.createPlaylist(playlistData);
          console.log(`Created playlist: ${playlistData.title}`);
        } catch (error) {
          console.error(`Failed to create playlist ${playlistData.title}:`, error);
        }
      }
      
      console.log('Default playlists created successfully');
    } catch (error) {
      console.error('Error creating default playlists:', error);
    }
  },

  // Sign Out
  signOut() {
    console.log('Starting sign out process...');
    setAuthToken(null);
    setCurrentUser(null);
    // Remove persisted auth on native platforms
    try {
      if (Platform.OS !== 'web') {
        AsyncStorage.removeItem('trackr_auth_token');
        AsyncStorage.removeItem('trackr_user');
      }
    } catch (err) {
      console.warn('Failed to clear persisted auth on signOut:', err);
    }
    console.log('Auth token and user cleared');
    console.log('Notifying all listeners of sign out...');
    this.notifyAuthChange(false, null);
    console.log('Sign out complete');
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

  // Request a password reset code (unauthenticated)
  async requestPasswordResetCode(email) {
    try {
      const response = await api.post('/auth/password-reset/request/', { email });
      return response.data;
    } catch (error) {
      console.error('Request password reset code error:', error);
      throw error.formattedMessage || error.response?.data || 'Failed to send reset code';
    }
  },

  async verifyPasswordResetCode({ userId, code }) {
    try {
      const response = await api.post('/auth/password-reset/verify/', {
        user_id: userId,
        code,
      });
      return response.data;
    } catch (error) {
      console.error('Verify password reset code error:', error);
      throw error.formattedMessage || error.response?.data || 'Failed to verify code';
    }
  },

  async confirmPasswordReset({ userId, newPassword }) {
    try {
      const response = await api.post('/auth/password-reset/confirm/', {
        user_id: userId,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Confirm password reset error:', error);
      throw error.formattedMessage || error.response?.data || 'Failed to reset password';
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
    
    // For native platforms try to restore from AsyncStorage
    try {
      if (Platform.OS !== 'web') {
        const storedToken = await AsyncStorage.getItem('trackr_auth_token');
        const storedUser = await AsyncStorage.getItem('trackr_user');
        if (storedToken) setAuthToken(storedToken);
        if (storedUser) {
          try { setCurrentUser(JSON.parse(storedUser)); } catch (err) { console.warn('Failed to parse stored user', err); }
        }
      }
    } catch (err) {
      console.warn('Error restoring auth from storage:', err);
    }

    // Check if we have stored auth data (in-memory or restored)
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
  },

  // Request a 6-digit password change code via email
  async requestPasswordChangeCode(email) {
    try {
      // Backend route list shows: auth/change-password/request/
      const response = await api.post('/auth/change-password/request/', { email });
      return response.data;
    } catch (error) {
      console.error('Request password change code error:', error);
      throw error.formattedMessage || error.response?.data || 'Failed to send verification code';
    }
  },

  // Complete password change with email + code + old/new passwords
  async changePasswordWithCode({ email, code, oldPassword, newPassword, confirmPassword }) {
    try {
      // Backend route list shows: auth/change-password/
      const response = await api.post('/auth/change-password/', {
        code,
        current_password: oldPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Change password with code error:', error);
      throw error.formattedMessage || error.response?.data || 'Failed to change password';
    }
  }
};