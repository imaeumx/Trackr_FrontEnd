// src/services/api.js - UPDATED WITH LOCALSTORAGE SUPPORT
import axios from 'axios';
import { Platform } from 'react-native';

// Base URL - your app found localhost:8000
const BASE_URL = 'https://trackr-backend-3lxu.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Storage helper for web
const storage = {
  getItem: (key) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Auth token management
let authToken = null;
let currentUser = null;

// Load from localStorage on initialization
if (Platform.OS === 'web') {
  try {
    const savedToken = storage.getItem('trackr_auth_token');
    const savedUser = storage.getItem('trackr_user');
    
    if (savedToken) {
      authToken = savedToken;
    }
    
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
    }
  } catch (error) {
    console.warn('Failed to load auth from localStorage:', error);
    // Clear invalid data
    storage.removeItem('trackr_auth_token');
    storage.removeItem('trackr_user');
  }
}

export const setAuthToken = (token) => {
  authToken = token;
  
  // Save to localStorage for web
  if (Platform.OS === 'web' && token) {
    storage.setItem('trackr_auth_token', token);
  } else if (Platform.OS === 'web' && !token) {
    storage.removeItem('trackr_auth_token');
  }
  
  // If token is being set to null, also clear user
  if (!token) {
    currentUser = null;
    if (Platform.OS === 'web') {
      storage.removeItem('trackr_user');
    }
  }
};

export const getAuthToken = () => {
  return authToken;
};

export const setCurrentUser = (user) => {
  currentUser = user;
  
  // Save to localStorage for web
  if (Platform.OS === 'web' && user) {
    storage.setItem('trackr_user', JSON.stringify(user));
  } else if (Platform.OS === 'web' && !user) {
    storage.removeItem('trackr_user');
  }
};

export const getCurrentUser = () => {
  return currentUser;
};

// Clear any demo/pre-set user data
export const clearDemoData = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  // If there's a user but no token, it's likely demo data
  if (user && !token) {
    console.log('Clearing demo user data from api.js');
    currentUser = null;
    if (Platform.OS === 'web') {
      storage.removeItem('trackr_user');
    }
    return true;
  }
  return false;
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    console.log('[API Interceptor] Request to:', config.url);
    console.log('[API Interceptor] Current authToken:', authToken ? `${authToken.substring(0, 10)}...` : 'NO TOKEN');
    if (authToken) {
      config.headers.Authorization = `Token ${authToken}`;
      console.log('[API Interceptor] Authorization header set');
    } else {
      console.warn('[API Interceptor] NO AUTH TOKEN AVAILABLE');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API Response] Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API Error] Status:', error.response?.status);
    console.error('[API Error] URL:', error.config?.url);
    console.error('[API Error] Data:', error.response?.data);
    console.error('[API Error] Message:', error.message);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('[API Error] 401 Unauthorized - clearing token');
      setAuthToken(null);
      setCurrentUser(null);
      
      // Clear localStorage on web
      if (Platform.OS === 'web') {
        storage.removeItem('trackr_auth_token');
        storage.removeItem('trackr_user');
      }
    }
    
    // Format error message
    if (error.response?.data) {
      // Handle different error formats
      if (typeof error.response.data === 'object') {
        if (error.response.data.error) {
          error.formattedMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          error.formattedMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          error.formattedMessage = error.response.data.non_field_errors[0];
        } else {
          // Get first error message from object
          const firstKey = Object.keys(error.response.data)[0];
          if (Array.isArray(error.response.data[firstKey])) {
            error.formattedMessage = `${firstKey}: ${error.response.data[firstKey][0]}`;
          } else {
            error.formattedMessage = `${firstKey}: ${error.response.data[firstKey]}`;
          }
        }
      } else {
        error.formattedMessage = JSON.stringify(error.response.data);
      }
    } else if (error.code === 'ECONNABORTED') {
      error.formattedMessage = 'Request timeout - server may be offline';
    } else if (error.message === 'Network Error') {
      error.formattedMessage = 'Cannot connect to server. Please check if the backend is running.';
    } else {
      error.formattedMessage = error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

export default api;