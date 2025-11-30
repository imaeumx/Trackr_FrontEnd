// src/services/api.js
import axios from 'axios';

// Base URL - your app found localhost:8000
const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For React Native, we'll use a simple approach without localStorage
let authToken = null;
let currentUser = null;

export const setAuthToken = (token) => {
  authToken = token;
  // If token is being set to null, also clear user
  if (!token) {
    currentUser = null;
  }
};

export const getAuthToken = () => {
  return authToken;
};

export const setCurrentUser = (user) => {
  currentUser = user;
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
    return true;
  }
  return false;
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Token ${authToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      setAuthToken(null);
      setCurrentUser(null);
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
          error.formattedMessage = `${firstKey}: ${error.response.data[firstKey][0]}`;
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