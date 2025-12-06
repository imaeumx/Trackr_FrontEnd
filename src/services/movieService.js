// src/services/movieService.js
import api from './api';

export const movieService = {
  // Get now playing movies - NOT AVAILABLE in your backend
  async getNowPlayingMovies(page = 1) {
    try {
      // Since you don't have this endpoint, let's use popular movies instead
      return await this.getPopularMovies('movie', page);
    } catch (error) {
      console.error('Get now playing movies error:', error);
      throw error.response?.data || error.message || 'Failed to load now playing movies';
    }
  },

  // Search movies from TMDB
  async searchMovies(query, page = 1, type = 'multi') {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      const response = await api.get('/tmdb/search/', {
        params: { query: query.trim(), page, type }
      });
      
      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Search movies error:', error);
      throw error.response?.data || error.message || 'Search failed';
    }
  },

  // Get popular movies - THIS IS AVAILABLE in your backend
  async getPopularMovies(type = 'movie', page = 1) {
    try {
      const response = await api.get('/tmdb/popular/', {
        params: { type, page }
      });
      
      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Get popular movies error:', error);
      throw error.response?.data || error.message || 'Failed to load popular movies';
    }
  },

  // Get top-rated movies/series - NOW AVAILABLE in your backend
  async getTopRatedMovies(type = 'movie', page = 1) {
    try {
      const response = await api.get('/tmdb/top-rated/', {
        params: { type, page }
      });
      
      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('Get top rated movies error:', error);
      throw error.response?.data || error.message || 'Failed to load top rated movies';
    }
  },

  // Get movie details from TMDB - THIS IS AVAILABLE
  async getMovieDetails(tmdbId) {
    try {
      if (!tmdbId) {
        throw new Error('TMDB ID is required');
      }

      const response = await api.get(`/tmdb/movies/${tmdbId}/`);
      
      if (!response.data) {
        throw new Error('Invalid movie details response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Get movie details error:', error);
      throw error.response?.data || error.message || 'Failed to load movie details';
    }
  },

  // Get TV show details from TMDB - THIS IS AVAILABLE
  async getTVDetails(tmdbId) {
    try {
      if (!tmdbId) {
        throw new Error('TMDB ID is required');
      }

      const response = await api.get(`/tmdb/tv/${tmdbId}/`);
      
      if (!response.data) {
        throw new Error('Invalid TV details response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Get TV details error:', error);
      throw error.response?.data || error.message || 'Failed to load TV show details';
    }
  },

  // Get or create movie in local database - THIS IS AVAILABLE
  async getOrCreateMovie(tmdbId, mediaType = 'movie') {
    try {
      if (!tmdbId) {
        throw new Error('TMDB ID is required');
      }

      console.log('[movieService.getOrCreateMovie] Sending TMDB ID:', tmdbId, 'mediaType:', mediaType);
      
      const response = await api.post('/movies/get_or_create/', {
        tmdb_id: parseInt(tmdbId),
        media_type: mediaType
      });
      
      console.log('[movieService.getOrCreateMovie] Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Get or create movie error:', error);
      throw error.response?.data || error.message || 'Failed to get or create movie';
    }
  },

  // Get all local movies - THIS IS AVAILABLE
  async getLocalMovies() {
    try {
      const response = await api.get('/movies/');
      
      if (!response.data || !Array.isArray(response.data.results)) {
        throw new Error('Invalid movies list response');
      }
      
      return response.data;
    } catch (error) {
      console.error('Get local movies error:', error);
      throw error.response?.data || error.message || 'Failed to load movies';
    }
  },

  // Create a movie manually - THIS IS AVAILABLE
  async createMovie(movieData) {
    try {
      const requiredFields = ['title'];
      const missingFields = requiredFields.filter(field => !movieData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await api.post('/movies/', movieData);
      return response.data;
    } catch (error) {
      console.error('Create movie error:', error);
      throw error.response?.data || error.message || 'Failed to create movie';
    }
  },

  // Get movie by ID from local database - THIS IS AVAILABLE
  async getMovieById(movieId) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }

      const response = await api.get(`/movies/${movieId}/`);
      return response.data;
    } catch (error) {
      console.error('Get movie by ID error:', error);
      throw error.response?.data || error.message || 'Failed to load movie';
    }
  },

  // Update movie in local database - THIS IS AVAILABLE
  async updateMovie(movieId, movieData) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }

      const response = await api.put(`/movies/${movieId}/`, movieData);
      return response.data;
    } catch (error) {
      console.error('Update movie error:', error);
      throw error.response?.data || error.message || 'Failed to update movie';
    }
  },

  // Delete movie from local database - THIS IS AVAILABLE
  async deleteMovie(movieId) {
    try {
      if (!movieId) {
        throw new Error('Movie ID is required');
      }

      const response = await api.delete(`/movies/${movieId}/`);
      return response.data;
    } catch (error) {
      console.error('Delete movie error:', error);
      throw error.response?.data || error.message || 'Failed to delete movie';
    }
  },

  // Get trending movies - NOT AVAILABLE in your backend
  async getTrendingMovies(timeWindow = 'week') {
    try {
      // Since you don't have this endpoint, let's use top-rated movies
      return await this.getTopRatedMovies('movie', 1);
    } catch (error) {
      console.error('Get trending movies error:', error);
      throw error.response?.data || error.message || 'Failed to load trending movies';
    }
  },

  // Get upcoming movies - NOT AVAILABLE in your backend
  async getUpcomingMovies(page = 1) {
    try {
      // Since you don't have this endpoint, let's use popular movies
      return await this.getPopularMovies('movie', page);
    } catch (error) {
      console.error('Get upcoming movies error:', error);
      throw error.response?.data || error.message || 'Failed to load upcoming movies';
    }
  },

  // DEPRECATED: Get top rated movies - use getTopRatedMovies instead
  async getTopRatedMovies(page = 1) {
    try {
      return await this.getTopRatedMovies('movie', page);
    } catch (error) {
      console.error('Get top rated movies error:', error);
      throw error.response?.data || error.message || 'Failed to load top rated movies';
    }
  },

  // NEW: Get movie trailers from TMDB (direct call, not through backend)
  async getMovieTrailers(tmdbId) {
    try {
      if (!tmdbId) {
        throw new Error('TMDB ID is required');
      }

      const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${API_KEY}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.results) {
        return null;
      }

      // First try to find Trailer or Teaser, then fall back to any YouTube video
      const trailer = data.results.find(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser')
      ) || data.results.find(v => v.site === 'YouTube');

      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
      console.error('Get movie trailers error:', error);
      return null;
    }
  },

  // NEW: Get TV show trailers from TMDB (direct call, not through backend)
  async getTVTrailers(tmdbId) {
    try {
      if (!tmdbId) {
        throw new Error('TMDB ID is required');
      }

      const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${tmdbId}/videos?api_key=${API_KEY}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.results) {
        return null;
      }

      const trailer = data.results.find(v => 
        v.site === 'YouTube' && 
        (v.type === 'Trailer' || v.type === 'Teaser')
      ) || data.results.find(v => v.site === 'YouTube');

      return trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;
    } catch (error) {
      console.error('Get TV trailers error:', error);
      return null;
    }
  },

  // Update a movie's media type
  async updateMediaType(movieId, mediaType) {
    try {
      if (!movieId || !mediaType) {
        throw new Error('Movie ID and media type are required');
      }

      const response = await api.patch(`/movies/${movieId}/update_media_type/`, {
        media_type: mediaType
      });
      
      console.log(`[movieService] Updated movie ${movieId} media_type to ${mediaType}`);
      return response.data;
    } catch (error) {
      console.error('Update media type error:', error);
      throw error.response?.data || error.message || 'Failed to update media type';
    }
  }
};