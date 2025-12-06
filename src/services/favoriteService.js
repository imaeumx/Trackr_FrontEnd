import api from './api';

/**
 * Service for managing user's favorite movies and TV series
 */
export const favoriteService = {
    /**
     * Get all favorites for the current user
     */
    getFavorites: async () => {
      try {
        console.log('[favoriteService] Fetching favorites...');
        const response = await api.get('/favorites/');
        console.log('[favoriteService] Favorites response:', response.data);
        return response.data;
      } catch (error) {
        console.error('[favoriteService] Error fetching favorites:', error);
        throw error;
      }
    },

    /**
     * Add a movie/series to favorites
     * @param {number} tmdbId - TMDB ID of the movie/series
     * @param {string} mediaType - 'movie' or 'tv'
     */
    addFavorite: async (tmdbId, mediaType = 'movie') => {
      try {
        console.log('[favoriteService] Adding favorite:', { tmdbId, mediaType });
        const response = await api.post('/favorites/', {
          tmdb_id: tmdbId,
          media_type: mediaType,
        });
        console.log('[favoriteService] Add favorite success:', response.data);
        return response.data;
      } catch (error) {
        console.error('[favoriteService] Error adding favorite:', error);
        console.error('[favoriteService] Error response:', error.response?.data);
        throw error;
      }
    },

    /**
     * Remove a movie/series from favorites by movie_id
     * @param {number} movieId - Internal movie ID
     */
    removeFavorite: async (movieId) => {
      try {
        const response = await api.delete(`/favorites/${movieId}/`);
        return response.data;
      } catch (error) {
        console.error('Error removing favorite:', error);
        throw error;
      }
    },

    /**
     * Remove a movie/series from favorites by TMDB ID
     * @param {number} tmdbId - TMDB ID
     */
    removeFavoriteByTmdb: async (tmdbId) => {
      try {
        console.log('[favoriteService] Removing favorite by TMDB:', { tmdbId });
        const response = await api.delete('/favorites/remove_by_tmdb/', {
          data: { tmdb_id: tmdbId },
        });
        console.log('[favoriteService] Remove favorite success:', response.data);
        return response.data;
      } catch (error) {
        console.error('[favoriteService] Error removing favorite by TMDB:', error);
        console.error('[favoriteService] Error response:', error.response?.data);
        throw error;
      }
    },

    /**
     * Check if a movie/series is favorited
     * @param {number} tmdbId - TMDB ID
     */
    checkFavorite: async (tmdbId) => {
      try {
        const response = await api.get('/favorites/check/', {
          params: { tmdb_id: tmdbId },
        });
        return response.data;
      } catch (error) {
        console.error('Error checking favorite:', error);
        return { is_favorite: false };
      }
    },
  };
