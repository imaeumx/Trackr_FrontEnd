// src/services/userService.js
import api from './api';

export const userService = {
  async getProfile() {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  },
};
