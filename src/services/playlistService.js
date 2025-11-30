// src/services/playlistService.js
import api from './api';

export const playlistService = {
  // Get all playlists
  async getPlaylists() {
    try {
      const response = await api.get('/playlists/');
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Get playlist by ID
  async getPlaylist(id) {
    try {
      const response = await api.get(`/playlists/${id}/`);
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Create playlist
  async createPlaylist(playlistData) {
    try {
      if (!playlistData.title || playlistData.title.trim() === '') {
        throw new Error('Playlist title is required');
      }
      
      const response = await api.post('/playlists/', {
        title: playlistData.title.trim(),
        description: playlistData.description || ''
      });
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Update playlist
  async updatePlaylist(id, playlistData) {
    try {
      if (!playlistData.title || playlistData.title.trim() === '') {
        throw new Error('Playlist title is required');
      }
      
      const response = await api.put(`/playlists/${id}/`, {
        title: playlistData.title.trim(),
        description: playlistData.description || ''
      });
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Delete playlist
  async deletePlaylist(id) {
    try {
      const response = await api.delete(`/playlists/${id}/`);
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Add movie to playlist
  async addMovieToPlaylist(playlistId, movieId, status = 'to_watch') {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      const response = await api.post(`/playlists/${playlistId}/add_movie/`, {
        movie_id: movieId,
        status
      });
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Remove movie from playlist
  async removeMovieFromPlaylist(playlistId, movieId) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      const response = await api.delete(`/playlists/${playlistId}/remove_movie/${movieId}/`);
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Update movie status in playlist
  async updateMovieStatus(playlistId, movieId, status) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      const validStatuses = ['to_watch', 'watching', 'watched'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be: to_watch, watching, or watched');
      }
      
      const response = await api.patch(`/playlists/${playlistId}/update_item_status/${movieId}/`, {
        status
      });
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Get playlist items
  async getPlaylistItems(playlistId) {
    try {
      const playlist = await this.getPlaylist(playlistId);
      return playlist.items || [];
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  }
};