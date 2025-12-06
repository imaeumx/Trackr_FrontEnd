// src/services/playlistService.js
import api from './api';

export const playlistService = {
  // Get all playlists
  async getPlaylists() {
    try {
      const response = await api.get('/playlists/');
      console.log('Get playlists response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get playlists error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Get playlist by ID with items
  async getPlaylist(id) {
    try {
      console.log('Fetching playlist ID:', id);
      const response = await api.get(`/playlists/${id}/`);
      console.log('Playlist response:', response.data);
      
      // Try to fetch items separately if not included
      if (!response.data.items) {
        try {
          const itemsResponse = await api.get(`/playlists/${id}/items/`);
          response.data.items = itemsResponse.data || [];
        } catch (itemsError) {
          console.warn('Could not fetch playlist items:', itemsError);
          response.data.items = [];
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Get playlist error:', error);
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Get playlist items
  async getPlaylistItems(playlistId) {
    try {
      const response = await api.get(`/playlists/${playlistId}/items/`);
      return response.data;
    } catch (error) {
      console.error('Get playlist items error:', error);
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

  // Delete playlist - FIXED VERSION
  async deletePlaylist(id) {
    try {
      console.log('Attempting to delete playlist ID:', id);
      
      const response = await api.delete(`/playlists/${id}/`);
      
      console.log('Delete response status:', response.status);
      
      // DRF returns 204 No Content for successful delete
      if (response.status === 204) {
        return { success: true, message: 'Playlist deleted successfully' };
      }
      
      return response.data || { success: true };
      
    } catch (error) {
      console.error('Delete playlist error details:', error);
      
      let errorMessage = 'Failed to delete playlist. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Playlist not found. It may have already been deleted.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.formattedMessage) {
        errorMessage = error.formattedMessage;
      }
      
      throw { 
        error: errorMessage,
        formattedMessage: errorMessage,
        status: error.response?.status 
      };
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

  // Remove movie from playlist - FIXED VERSION
  async removeMovieFromPlaylist(playlistId, movieId) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      console.log('Removing movie from playlist:', { playlistId, movieId });
      
      const response = await api.delete(`/playlists/${playlistId}/remove_movie/${movieId}/`);
      
      console.log('Remove movie response:', response.data);
      
      if (response.status === 200 || response.status === 204) {
        return { 
          success: true, 
          message: 'Movie removed from playlist',
          data: response.data 
        };
      }
      
      return response.data || { 
        success: true, 
        message: 'Movie removed' 
      };
      
    } catch (error) {
      console.error('Remove movie from playlist error:', error);
      
      let errorMessage = 'Failed to remove movie from playlist.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Movie not found in this playlist.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.formattedMessage) {
        errorMessage = error.formattedMessage;
      }
      
      throw { 
        error: errorMessage,
        formattedMessage: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  },

  // Update movie status in playlist
  async updateMovieStatus(playlistId, movieId, status) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      const validStatuses = ['to_watch', 'watching', 'watched', 'did_not_finish'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status. Must be: to_watch, watching, watched, or did_not_finish');
      }
      
      const response = await api.patch(`/playlists/${playlistId}/update_item_status/${movieId}/`, {
        status
      });
      return response.data;
    } catch (error) {
      throw error.formattedMessage || error.response?.data || error;
    }
  },

  // Update movie rating in playlist
  async updateMovieRating(playlistId, movieId, rating) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }
      
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const response = await api.patch(`/playlists/${playlistId}/update_item_rating/${movieId}/`, {
        rating
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