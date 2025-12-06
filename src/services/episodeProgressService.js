// src/services/episodeProgressService.js
import api from './api';
import episodeProgressLogger from '../utils/episodeProgressLogger';

export const episodeProgressService = {
  // Query progress records for the current user. Accepts optional filtering.
  // params: { seriesId, season, episode }
  async getProgress(params = {}) {
    try {
      const qs = [];
      if (params.seriesId) qs.push(`series=${encodeURIComponent(params.seriesId)}`);
      if (params.season !== undefined && params.season !== null) qs.push(`season=${encodeURIComponent(params.season)}`);
      if (params.episode !== undefined && params.episode !== null) qs.push(`episode=${encodeURIComponent(params.episode)}`);
      const query = qs.length ? `?${qs.join('&')}` : '';

      episodeProgressLogger.log('Fetching episode progress', { params, query });
      const response = await api.get(`/episode-progress/${query}`);
      episodeProgressLogger.log('Fetched episode progress response', { data: response.data });
      return response.data;
    } catch (error) {
      episodeProgressLogger.log('Error fetching episode progress', { error });
      console.error('episodeProgressService.getProgress error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Get a single progress record by id
  async getProgressById(id) {
    try {
      const response = await api.get(`/episode-progress/${id}/`);
      return response.data;
    } catch (error) {
      console.error('episodeProgressService.getProgressById error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Create a new progress record for the authenticated user
  // data: { series_id, season, episode, status, notes, rating }
  async createProgress(data) {
    try {
      const payload = {
        series_id: data.series_id || data.seriesId || data.series,
        season: data.season,
        episode: data.episode,
        status: (data.status === 'completed') ? 'completed' : 'watching',
      };
      if (data.notes !== undefined) payload.notes = data.notes;
      if (
        data.rating !== undefined &&
        data.rating !== null &&
        Number.isInteger(data.rating) &&
        data.rating >= 1 &&
        data.rating <= 5
      ) {
        payload.rating = data.rating;
      }

      episodeProgressLogger.log('Saving episode progress', { payload });
      const response = await api.post('/episode-progress/', payload);
      episodeProgressLogger.log('Saved episode progress response', { data: response.data });
      return response.data;
    } catch (error) {
      episodeProgressLogger.log('Error saving episode progress', { error });
      console.error('episodeProgressService.createProgress error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Update an existing progress record (partial update supported)
  async updateProgress(id, data) {
    try {
      const payload = {};
      if (data.season !== undefined) payload.season = data.season;
      if (data.episode !== undefined) payload.episode = data.episode;
      if (data.status !== undefined) payload.status = (data.status === 'completed') ? 'completed' : 'watching';
      if (data.notes !== undefined) payload.notes = data.notes;
      if (
        data.rating !== undefined &&
        data.rating !== null &&
        Number.isInteger(data.rating) &&
        data.rating >= 1 &&
        data.rating <= 5
      ) {
        payload.rating = data.rating;
      }

      episodeProgressLogger.log('Updating episode progress', { id, payload });
      const response = await api.patch(`/episode-progress/${id}/`, payload);
      episodeProgressLogger.log('Updated episode progress response', { data: response.data });
      return response.data;
    } catch (error) {
      episodeProgressLogger.log('Error updating episode progress', { error });
      console.error('episodeProgressService.updateProgress error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Delete a progress record
  async deleteProgress(id) {
    try {
      const response = await api.delete(`/episode-progress/${id}/`);
      // DRF may return 204 No Content
      if (response.status === 204) return { success: true };
      return response.data || { success: true };
    } catch (error) {
      console.error('episodeProgressService.deleteProgress error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Helper: get or create progress record for a specific episode
  // Returns existing record if found, otherwise creates one with provided defaults
  async getOrCreateProgress({ seriesId, season, episode, defaults = {} }) {
    try {
      const list = await this.getProgress({ seriesId, season, episode });
      if (Array.isArray(list) && list.length > 0) return list[0];
      // Create with sensible defaults
      const created = await this.createProgress({
        series_id: seriesId,
        season,
        episode,
        status: defaults.status || 'not_started',
        notes: defaults.notes || '',
        rating: defaults.rating || null,
      });
      return created;
    } catch (error) {
      console.error('episodeProgressService.getOrCreateProgress error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  }
};

export default episodeProgressService;
