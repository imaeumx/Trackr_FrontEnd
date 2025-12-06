import api from './api';

// Series episode-level progress (server-backed with local fallback)
export const progressService = {
  // Local storage key for episode progress
  getStorageKey: (tmdbId) => `series_progress_${tmdbId}`,

  // Get item from localStorage (web-compatible)
  getFromLocalStorage: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return JSON.parse(window.localStorage.getItem(key));
      }
    } catch (err) {
      console.error('[progressService] Error reading localStorage:', err);
    }
    return null;
  },

  // Set item to localStorage (web-compatible)
  setToLocalStorage: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (err) {
      console.error('[progressService] Error writing to localStorage:', err);
    }
    return false;
  },

  async getSeriesProgress(tmdbId) {
    try {
      // Try to fetch from server first
      const response = await api.get(`/series/${tmdbId}/progress/`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, try local storage
      if (error.response?.status === 404) {
        console.warn('[progressService] Endpoint not available, loading from local storage');
        const stored = this.getFromLocalStorage(this.getStorageKey(tmdbId));
        return stored || null;
      }
      throw error;
    }
  },

  async upsertSeriesProgress(tmdbId, payload) {
    try {
      // Try to save to server first
      const response = await api.post(`/series/${tmdbId}/progress/`, payload);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, save to local storage
      if (error.response?.status === 404) {
        console.warn('[progressService] Endpoint not available, saving to local storage');
        
        // Get existing history or create new
        const existing = this.getFromLocalStorage(this.getStorageKey(tmdbId)) || { history: [] };
        
        // Add new entry to history
        const newEntry = {
          ...payload,
          updated_at: new Date().toISOString(),
        };
        
        // Keep only last 10 entries per series
        existing.history = [newEntry, ...((existing.history || []).slice(0, 9))];
        
        // Also update the top-level fields with the latest values
        // so they persist when the user navigates away and comes back
        existing.season = payload.season;
        existing.episode = payload.episode;
        existing.rating = payload.rating;
        existing.notes = payload.notes;
        existing.updated_at = newEntry.updated_at;
        
        // Save updated data
        const saved = this.setToLocalStorage(this.getStorageKey(tmdbId), existing);
        
        if (saved) {
          return existing;
        } else {
          throw new Error('Failed to save to local storage');
        }
      }
      throw error;
    }
  },

};
  