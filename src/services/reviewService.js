import api from './api';

export const reviewService = {
  // Create or update a review
  async submitReview(movieTmdbId, rating, reviewText = '', mediaType = 'movie') {
    try {
      const normalizedMediaType = mediaType && (mediaType.toLowerCase() === 'tv' || mediaType.toLowerCase() === 'series' || mediaType.toLowerCase() === 'tv show') ? 'tv' : 'movie';
      // Ensure rating is an integer
      const numericRating = parseInt(rating, 10);
      
      if (!movieTmdbId) {
        throw new Error('Movie ID is required');
      }
      
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      console.log('[ReviewService] Ensuring movie exists for TMDB ID:', movieTmdbId, 'mediaType:', normalizedMediaType);

      // Ensure the movie exists in backend and get its database ID
      let movieId = null;
      const tryResolve = async (mediaTypeToUse) => {
        const resp = await api.post('/movies/get_or_create/', {
          tmdb_id: movieTmdbId,
          media_type: mediaTypeToUse,
        });
        if (!resp?.data?.id) {
          throw new Error('Failed to resolve movie id');
        }
        return resp.data.id;
      };

      try {
        movieId = await tryResolve(normalizedMediaType);
      } catch (lookupError) {
        // Only allow fallback from 'movie' to 'tv', not the other way around
        if (normalizedMediaType === 'movie') {
          const altType = 'tv';
          try {
            console.warn('[ReviewService] Primary lookup failed, retrying with media type:', altType);
            movieId = await tryResolve(altType);
          } catch (fallbackError) {
            console.error('[ReviewService] Could not resolve movie id after fallback:', fallbackError);
            throw fallbackError;
          }
        } else {
          // If intended type is 'tv', do NOT fallback to 'movie'
          throw lookupError;
        }
      }

      console.log('[ReviewService] Resolved movie id:', movieId);

      const reviewData = {
        movie: movieId,
        tmdb_id: movieTmdbId,
        rating: numericRating,
        review_text: String(reviewText || ''),
        media_type: normalizedMediaType,
      };

      console.log('[ReviewService] Submitting review:', {
        movieTmdbId,
        movieId,
        rating: numericRating,
        reviewText,
        reviewData,
      });

      // Check if review already exists
      let existingReview = null;
      try {
        existingReview = await this.getUserReview({ tmdbId: movieTmdbId });
        console.log('[ReviewService] Existing review found:', existingReview);
      } catch (err) {
        // No existing review, which is fine
        console.log('[ReviewService] No existing review found, will create new');
        existingReview = null;
      }
      
      if (existingReview) {
        // Update existing review
        console.log('[ReviewService] Updating existing review with ID:', existingReview.id);
        try {
          const response = await api.patch(`/reviews/${existingReview.id}/`, reviewData);
          console.log('[ReviewService] Update response:', response.data);
          return response.data;
        } catch (patchError) {
          console.error('[ReviewService] Patch error details:', {
            status: patchError.response?.status,
            data: patchError.response?.data,
            message: patchError.message,
          });
          throw patchError;
        }
      } else {
        // Create new review
        console.log('[ReviewService] Creating new review with data:', reviewData);
        try {
          const response = await api.post('/reviews/', reviewData);
          console.log('[ReviewService] Create response:', response.data);
          return response.data;
        } catch (postError) {
          console.error('[ReviewService] Post error details:', {
            status: postError.response?.status,
            data: postError.response?.data,
            message: postError.message,
          });
          throw postError;
        }
      }
    } catch (error) {
      console.error('[ReviewService] Review submission error:', error);
      console.error('[ReviewService] Error response:', error.response?.data);
      console.error('[ReviewService] Error status:', error.response?.status);
      console.error('[ReviewService] Formatted message:', error.formattedMessage);
      throw error;
    }
  },

  // Get user's review for a specific movie
  async getUserReview({ tmdbId, movieId }) {
    try {
      const params = {};
      if (tmdbId) params.tmdb_id = tmdbId;
      if (movieId) params.movie_id = movieId;
      // Accept mediaType for correct lookup (movie/tv)
      if (arguments[0]?.mediaType) {
        params.media_type = arguments[0].mediaType;
      }
      console.log('[ReviewService] [DEBUG] Getting user review with params:', params);
      const response = await api.get('/reviews/by_movie/', { params });
      console.log('[ReviewService] [DEBUG] Backend response for getUserReview:', response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('[ReviewService] [DEBUG] No review found for params:', { tmdbId, movieId, mediaType: arguments[0]?.mediaType });
        return null; // No review found
      }
      console.error('[ReviewService] [DEBUG] Error getting user review:', error);
      throw error;
    }
  },

  // Get all reviews for a movie (DEPRECATED - privacy policy)
  async getMovieReviews(movieId) {
    try {
      console.warn('[ReviewService] getMovieReviews() is deprecated. Users can only see their own reviews.');
      return [];
    } catch (error) {
      console.error('Failed to fetch movie reviews:', error);
      return [];
    }
  },

  // Get all reviews by current user
  async getUserReviews() {
    try {
      const response = await api.get('/reviews/my_reviews/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete a review
  async deleteReview(arg) {
    try {
      let reviewId = arg;
      let tmdbId = null;
      let movieId = null;

      // Support calling with an object for resilience
      if (typeof arg === 'object' && arg !== null) {
        reviewId = arg.reviewId || arg.id;
        tmdbId = arg.tmdbId;
        movieId = arg.movieId;
      }

      // If no id provided, resolve via current user's review lookup
      // Helper to delete by movie reference
      const deleteByMovie = async () => {
        if (!tmdbId && !movieId) {
          throw new Error('Review ID not found to delete');
        }
        const payload = {
          tmdb_id: tmdbId ? parseInt(tmdbId, 10) : undefined,
          movie_id: movieId ? parseInt(movieId, 10) : undefined,
        };
        console.log('[ReviewService] Deleting by movie reference', payload);
        const response = await api.delete('/reviews/delete_by_movie/', {
          data: payload,
        });
        return response.data;
      };

      // If no review id, use movie-based delete directly
      if (!reviewId) {
        return await deleteByMovie();
      }

      // Try deleting by id first, fall back to movie-based if 404/400
      try {
        console.log('[ReviewService] Deleting review id:', reviewId, 'tmdbId:', tmdbId, 'movieId:', movieId);
        const response = await api.delete(`/reviews/${reviewId}/`);
        return response.data;
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 400) {
          console.warn('[ReviewService] Delete by id failed, retrying by movie', err.response?.data || err.message);
          return await deleteByMovie();
        }
        throw err;
      }
    } catch (error) {
      console.error('[ReviewService] Error deleting review:', error.response?.data || error.message || error);
      throw error;
    }
  },

  // Get average rating for a movie (DEPRECATED - privacy policy)
  async getMovieAverageRating(movieId) {
    try {
      console.warn('[ReviewService] getMovieAverageRating() is deprecated. Average ratings not available for privacy reasons.');
      return null;
    } catch (error) {
      return null;
    }
  },
};
