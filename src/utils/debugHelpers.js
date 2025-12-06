import { movieService } from '../services/movieService';

/**
 * Debug helper to fix a movie's incorrect media_type
 * Usage in console: window.fixMovieMediaType(movieId, newMediaType)
 * Example: window.fixMovieMediaType(42, 'tv')
 */
export const fixMovieMediaType = async (movieId, newMediaType) => {
  try {
    if (!movieId || !newMediaType) {
      console.error('❌ Usage: fixMovieMediaType(movieId, newMediaType)');
      console.error('Example: fixMovieMediaType(42, "tv")');
      return;
    }

    console.log(`[debugHelpers] Attempting to fix movie ${movieId} media_type to ${newMediaType}...`);
    const result = await movieService.updateMediaType(movieId, newMediaType);
    console.log(`✅ Successfully updated movie ${movieId} to media_type: ${result.media_type}`);
    console.log('Movie details:', result);
    return result;
  } catch (error) {
    console.error('❌ Error fixing movie media type:', error);
  }
};

/**
 * Debug helper to show all watched items with their media types
 */
export const showWatchedItemsDebug = (watchedItems) => {
  console.log('=== WATCHED ITEMS DEBUG ===');
  watchedItems.forEach((item, idx) => {
    console.log(`[${idx}] ${item.movie?.title || 'Unknown'}`);
    console.log(`    ID: ${item.movie?.id}, TMDB: ${item.movie?.tmdb_id}`);
    console.log(`    Media Type: ${item.movie?.media_type}`);
  });
  console.log('==========================');
};

// Expose helpers to window for console usage
if (typeof window !== 'undefined') {
  window.fixMovieMediaType = fixMovieMediaType;
  window.showWatchedItemsDebug = showWatchedItemsDebug;
}
