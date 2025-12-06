// src/screens/MovieDetailScreen.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  Platform
} from 'react-native';
import DecisionModal from '../components/DecisionModal';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';
import Toast from '../components/Toast';
import { movieService } from '../services/movieService';
import { playlistService } from '../services/playlistService';
import { reviewService } from '../services/reviewService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie: movieParam, movieId, mediaType, tmdbId } = route.params || {};
  const [movie, setMovie] = useState(movieParam || null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [watchStatus, setWatchStatus] = useState('');
  const prevTmdbIdRef = React.useRef(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [userReview, setUserReview] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const playlistDescRef = React.useRef();
  
  const { isLoggedIn } = useAuth();

  const resolveTmdbId = () =>
    tmdbId || movieDetails?.tmdb_id || movieDetails?.id || movie?.tmdb_id || movie?.id || movieParam?.id;

  const resolveMediaType = () => {
    const type = mediaType || movieDetails?.type || movie?.type || movieParam?.type;
    const normalized = typeof type === 'string' ? type.toLowerCase() : '';
    // Check for variations of series/tv type
    return normalized === 'tv' || normalized === 'series' || normalized === 'tv show' ? 'tv' : 'movie';
  };

  useEffect(() => {
    const loadMovieDetails = async () => {
      const tmdb = tmdbId || movieId || movieParam?.id;
      const type = mediaType || movieParam?.type || 'movie';
      
      // If we have movieParam, use it immediately as fallback
      if (movieParam) {
        setMovieDetails(movieParam);
        setLoading(false);
        
        // Then fetch fresh data if we have a tmdbId
        if (!tmdb) return;
      } else if (!tmdb) {
        setError('No movie information provided');
        setLoading(false);
        return;
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        // Decide whether to fetch TV or movie details
        if (type === 'tv' || type === 'series') {
          const tv = await movieService.getTVDetails(tmdb);
          setMovieDetails({
            id: tv.id,
            title: tv.name || tv.title,
            type: 'series',
            rating: tv.vote_average ? (tv.vote_average / 2).toFixed(1) : 'N/A',
            year: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A',
            overview: tv.overview,
            poster_path: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : null,
            backdrop_path: tv.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` : null,
            genres: tv.genres || [],
            runtime: tv.episode_run_time?.[0] || tv.runtime || 'N/A',
            status: tv.status || 'N/A',
            tagline: tv.tagline || '',
            vote_average: tv.vote_average || 0,
            vote_count: tv.vote_count || 0,
            seasons: tv.number_of_seasons || 0,
            episodes: tv.number_of_episodes || 0,
            seasonsInfo: tv.seasons || [],
          });
        } else {
          const m = await movieService.getMovieDetails(tmdb);
          setMovieDetails({
            id: m.id,
            title: m.title || m.name,
            type: 'movie',
            rating: m.vote_average ? (m.vote_average / 2).toFixed(1) : 'N/A',
            year: m.release_date ? new Date(m.release_date).getFullYear() : 'N/A',
            overview: m.overview,
            poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
            genres: m.genres || [],
            runtime: m.runtime || 'N/A',
            status: m.status || 'N/A',
            tagline: m.tagline || '',
            vote_average: m.vote_average || 0,
            vote_count: m.vote_count || 0,
            budget: m.budget || 0,
            revenue: m.revenue || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError('Failed to load movie details.');
        
        // If we have movieParam, use it as fallback
        if (movieParam) {
          setMovieDetails(movieParam);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMovieDetails();
  }, [movieParam, movieId, mediaType, tmdbId]);

  // Open review modal if requested from navigation (e.g., Profile screen tap)
  useEffect(() => {
    if (route.params?.openReviewModal && movieDetails) {
      setShowReviewModal(true);
      navigation.setParams({ ...route.params, openReviewModal: false });
    }
  }, [route.params?.openReviewModal, movieDetails]);

  // Check if movie is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!isLoggedIn || !movieDetails) return;
      
      try {
        const tmdb = resolveTmdbId();
        if (!tmdb) return;
        
        const result = await favoriteService.checkFavorite(tmdb);
        setIsFavorite(result.is_favorite || false);
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    };

    checkFavorite();
  }, [isLoggedIn, movieDetails]);

  // Load watch status from playlists
  useEffect(() => {
    const loadWatchStatus = async () => {
      if (!isLoggedIn) return;

      try {
        const tmdbId = resolveTmdbId();
        if (!tmdbId) {
          setWatchStatus('');
          return;
        }

        // Get all playlists
        const playlistsResponse = await playlistService.getPlaylists();
        const allPlaylists = Array.isArray(playlistsResponse) 
          ? playlistsResponse 
          : (playlistsResponse.results || []);

        // Check which status playlist contains this movie
        const statusPlaylists = ['Watched', 'Watching', 'To Watch', 'Did Not Finish'];
        
        for (const playlistName of statusPlaylists) {
          const playlist = allPlaylists.find(p => p.title === playlistName && p.is_status_playlist);
          if (playlist) {
            const itemsResponse = await playlistService.getPlaylistItems(playlist.id);
            const items = Array.isArray(itemsResponse) 
              ? itemsResponse 
              : (itemsResponse.results || []);
            
            // Check if this movie is in this playlist (using both ID and TMDB ID)
            const isInPlaylist = items.some(item => 
              item.movie?.id === movieDetails?.id || 
              item.movie?.tmdb_id === tmdbId ||
              item.movie?.id === movie?.id
            );
            
            if (isInPlaylist) {
              setWatchStatus(playlistName);
              return; // Found the status, exit
            }
          }
        }
        
        // Not in any status playlist
        setWatchStatus('');
      } catch (error) {
        console.error('[MovieDetailScreen] Failed to load watch status:', error);
      }
    };

    loadWatchStatus();
  }, [isLoggedIn, movieDetails]);

  // Reload watch status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const reloadStatus = async () => {
        if (!isLoggedIn) {
          setWatchStatus('');
          return;
        }

        try {
          const currentTmdbId = resolveTmdbId();
          
          // Only reload if we're looking at a different movie
          if (prevTmdbIdRef.current !== currentTmdbId) {
            prevTmdbIdRef.current = currentTmdbId;
            
            if (!currentTmdbId) {
              setWatchStatus('');
              return;
            }

            // Get all playlists
            const playlistsResponse = await playlistService.getPlaylists();
            const allPlaylists = Array.isArray(playlistsResponse) 
              ? playlistsResponse 
              : (playlistsResponse.results || []);

            // Check each status playlist
            for (const playlistName of ['Watched', 'Watching', 'To Watch', 'Did Not Finish']) {
              const playlist = allPlaylists.find(p => p.title === playlistName && p.is_status_playlist);
              if (!playlist) continue;

              const itemsResponse = await playlistService.getPlaylistItems(playlist.id);
              const items = Array.isArray(itemsResponse) 
                ? itemsResponse 
                : (itemsResponse.results || []);
              
              // Check if movie is in this playlist
              const found = items.some(item => 
                item.movie?.id === movieDetails?.id || 
                item.movie?.tmdb_id === currentTmdbId ||
                item.movie?.id === movie?.id
              );

              if (found) {
                setWatchStatus(playlistName);
                return;
              }
            }

            setWatchStatus('');
          }
        } catch (error) {
          console.error('Failed to reload watch status:', error);
        }
      };

      reloadStatus();
      
      // Cleanup
      return () => {
        // Reset on screen blur
      };
    }, [isLoggedIn, movieDetails, movie])
  );

  // Reload favorite status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const checkFavoriteStatus = async () => {
        if (!isLoggedIn || !movieDetails) return;

        try {
          const tmdb = resolveTmdbId();
          if (!tmdb) return;

          const result = await favoriteService.checkFavorite(tmdb);
          setIsFavorite(result.is_favorite || false);
        } catch (error) {
          console.error('Failed to check favorite status:', error);
        }
      };

      checkFavoriteStatus();

      return () => {
        // Cleanup if needed
      };
    }, [isLoggedIn, movieDetails])
  );

  // Fetch trailer URL
  useEffect(() => {
    const fetchTrailer = async () => {
      if (!movieDetails) return;
      setLoadingTrailer(true);
      try {
        const tmdb = tmdbId || movieId || movieParam?.id || movieDetails?.id;
        const type = mediaType || movieParam?.type || movieDetails?.type || 'movie';
        
        if (!tmdb) return;

        let url;
        if (type === 'tv' || type === 'series') {
          url = await movieService.getTVTrailers(tmdb);
        } else {
          url = await movieService.getMovieTrailers(tmdb);
        }

        if (url) {
          setTrailerUrl(url);
        }
      } catch (error) {
        console.log('Failed to fetch trailer:', error);
      } finally {
        setLoadingTrailer(false);
      }
    };

    fetchTrailer();
  }, [movieDetails]);

  // Load reviews when movie changes
  useEffect(() => {
    if (!movieDetails?.id && !movie?.id) return;

    const loadReviews = async () => {
      try {
        const tmdbIdentifier = resolveTmdbId();
        const mediaType = resolveMediaType();
        if (!tmdbIdentifier) return;

        // Only load user's review (privacy-focused)
        if (isLoggedIn) {
          const review = await reviewService.getUserReview({ tmdbId: tmdbIdentifier, mediaType });
          if (review) {
            setUserReview(review);
            setUserRating(review.rating);
            setReviewText(review.review_text);
          } else {
            // Reset review state if no review found
            setUserReview(null);
            setUserRating(0);
            setReviewText('');
          }
        }
      } catch (error) {
        console.error('Error loading user review:', error);
      }
    };

    loadReviews();
  }, [movieDetails, movie, isLoggedIn]);

  const handleAddToList = async (statusKey = null) => {
    // Check if user is logged in
    if (!isLoggedIn) {
      showToast('Please sign in to add movies to your list', 'error');
      navigation.navigate('Sign In');
      return;
    }

    // Fetch user's playlists and open modal for selection
    // Users can add to any playlist they want, including status playlists
    try {
      setLoadingPlaylists(true);
      const playlistsResponse = await playlistService.getPlaylists();
      
      // Handle both array response and object with results
      const userPlaylists = Array.isArray(playlistsResponse) 
        ? playlistsResponse 
        : (playlistsResponse.results || []);
      
      // Sort playlists: pin To Watch/Watching/Watched, then user lists + Did Not Finish by updated_at
      const pinnedStatusOrder = ['To Watch', 'Watching', 'Watched'];
      const sortedPlaylists = [...userPlaylists].sort((a, b) => {
        // Check if item is a pinned status playlist
        const aIsPinned = pinnedStatusOrder.includes(a.title);
        const bIsPinned = pinnedStatusOrder.includes(b.title);
        
        // Pinned playlists come first, in their defined order
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        
        // If both are pinned, sort by their position in pinnedStatusOrder
        if (aIsPinned && bIsPinned) {
          const aIdx = pinnedStatusOrder.indexOf(a.title);
          const bIdx = pinnedStatusOrder.indexOf(b.title);
          return aIdx - bIdx;
        }
        
        // For unpinned (Did Not Finish + user lists), sort by updated_at (most recent first)
        const aTime = new Date(a.updated_at).getTime();
        const bTime = new Date(b.updated_at).getTime();
        return bTime - aTime;
      });
      
      // Show modal even if no playlists - user can create one
      setPlaylists(sortedPlaylists);
      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      showToast('Failed to load playlists. Please try again.', 'error');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleSelectPlaylist = async (playlistId) => {
    try {
      setShowPlaylistModal(false);
      
      // Get TMDB ID and media type from movieDetails
      const tmdbId = movieDetails?.id || movieDetails?.tmdb_id;
      const mediaType = (movieDetails?.type === 'series' || movieDetails?.type === 'tv') ? 'tv' : 'movie';
      
      if (!tmdbId) {
        Alert.alert('Error', 'Movie information is missing. Please try again.');
        return;
      }

      // First, ensure the movie exists in the backend database
      let movieIdToAdd;
      try {
        console.log('Creating/getting movie in backend:', { tmdbId, mediaType });
        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        movieIdToAdd = createdMovie.id;
        console.log('Movie created/found with ID:', movieIdToAdd);
      } catch (err) {
        console.error('Error creating movie in backend:', err);
        Alert.alert('Error', 'Failed to add movie to backend. Please try again.');
        return;
      }

      // Add movie to selected playlist
      console.log('Adding movie to playlist:', { playlistId, movieIdToAdd });
      await playlistService.addMovieToPlaylist(playlistId, movieIdToAdd, 'to_watch');
      Alert.alert('Success', 'Movie added to your playlist!');
    } catch (error) {
      console.error('Error adding to playlist:', error);
      if (error.error === 'Movie already in playlist') {
        Alert.alert('Already Added', 'This movie is already in that playlist.');
      } else {
        Alert.alert('Error', error.formattedMessage || 'Failed to add movie to playlist. Please try again.');
      }
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      setLoadingPlaylists(true);
      const newPlaylist = await playlistService.createPlaylist({
        title: newPlaylistName.trim(),
        description: newPlaylistDescription.trim()
      });

      if (movieDetails) {
        const tmdbId = movieDetails.id || movieDetails.tmdb_id;
        const mediaType = movieDetails.type === 'Series' ? 'tv' : 'movie';
        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        await playlistService.addMovieToPlaylist(newPlaylist.id, createdMovie.id, 'to_watch');
      }

      Alert.alert('Success', `Created playlist "${newPlaylistName}" and added movie!`);
      setShowCreatePlaylistInput(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleRate = (rating) => {
    setUserRating(rating);
    Alert.alert('Rating Added', `You rated this ${rating} stars`);
  };

  const handleSetStatus = async (status) => {
    if (!isLoggedIn) {
      showToast('Please sign in to update status', 'error');
      navigation.navigate('Sign In');
      return;
    }

    const statusMap = {
      Watched: 'watched',
      Watching: 'watching',
      'To Watch': 'to_watch',
      'Did Not Finish': 'did_not_finish',
      watched: 'watched',
      watching: 'watching',
      to_watch: 'to_watch',
      did_not_finish: 'did_not_finish'
    };

    const statusPlaylistNames = {
      'watched': 'Watched',
      'watching': 'Watching',
      'to_watch': 'To Watch',
      'did_not_finish': 'Did Not Finish'
    };

    const statusKey = statusMap[status];
    const displayStatus = statusKey ? (statusPlaylistNames[statusKey] || status) : status;

    if (!statusKey) {
      showToast('Invalid watch status', 'error');
      return;
    }

    // Set the watch status immediately to update UI
    setWatchStatus(displayStatus);
    
    // Auto-move to the corresponding status playlist
    try {
      setLoadingPlaylists(true);
      const targetPlaylistName = statusPlaylistNames[statusKey];

      // Fetch ALL playlists to find status playlists
      const playlistsResponse = await playlistService.getPlaylists();
      const allPlaylists = Array.isArray(playlistsResponse)
        ? playlistsResponse
        : (playlistsResponse.results || []);

      const statusPlaylists = allPlaylists.filter(p => p.is_status_playlist);
      const targetPlaylist = statusPlaylists.find(p => p.title === targetPlaylistName);
      const fallbackPlaylist = statusPlaylists[0];

      if (!targetPlaylist && !fallbackPlaylist) {
        showToast('Status playlist not found', 'error');
        return;
      }

      const tmdbId = movieDetails?.id || movieDetails?.tmdb_id;
      const mediaType = (movieDetails?.type === 'series' || movieDetails?.type === 'tv') ? 'tv' : 'movie';

      if (!tmdbId) {
        showToast('Movie information is missing', 'error');
        return;
      }

      // Get or create movie in backend
      const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);

      // Remove from all status playlists first
      for (const playlist of statusPlaylists) {
        try {
          await playlistService.removeMovieFromPlaylist(playlist.id, createdMovie.id);
        } catch (err) {
          // Ignore errors if not present
        }
      }

      // Add to the target status playlist
      const playlistForMove = targetPlaylist || fallbackPlaylist;
      await playlistService.addMovieToPlaylist(playlistForMove.id, createdMovie.id, statusKey);

      const successMessage = statusKey === 'did_not_finish' ? 'Marked as Did Not Finish' : `Moved to ${targetPlaylistName}`;
      showToast(successMessage, 'success');

    } catch (error) {
      console.error('Error updating watch status:', error);
      // If the movie is already in the target playlist, just update UI - that's fine
      if (error?.response?.data?.error === 'Film already in playlist' ||
          error?.error?.includes('already in playlist') ||
          error?.formattedMessage?.includes('already in playlist')) {
        showToast(`Set to ${displayStatus}`, 'info');
      } else {
        showToast('Failed to update watch status', 'error');
      }
    } finally {
      setLoadingPlaylists(false);
    }

    // If status is "Watched", prompt user to rate after a delay
    if (status === 'Watched') {
      setTimeout(() => {
        setShowReviewModal(true);
      }, 1000);
    }
  };

  const formatRuntime = (minutes) => {
    if (!minutes || minutes === 'N/A') return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount <= 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmitReview = async () => {
    if (!isLoggedIn) {
      showToast('Please sign in to leave a review', 'error');
      navigation.navigate('Sign In');
      return;
    }

    if (userRating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const tmdbIdentifier = resolveTmdbId();
      const type = resolveMediaType();

      if (!tmdbIdentifier) {
        showToast('Film information is missing', 'error');
        return;
      }

      console.log('[MovieDetailScreen] Submitting review for film:', tmdbIdentifier, 'Rating:', userRating, 'Type:', type);
      await reviewService.submitReview(tmdbIdentifier, userRating, reviewText, type);

      // Notify PlaylistDetailScreen to reload on return
      if (navigation && navigation.setParams) {
        navigation.setParams({ ...route.params, ratingUpdated: true });
      }

      // After submitting review, always check backend status and prompt if needed
      const getBackendWatchStatus = async () => {
        try {
          const tmdbId = resolveTmdbId();
          if (!tmdbId) return '';
          const playlistsResponse = await playlistService.getPlaylists();
          const allPlaylists = Array.isArray(playlistsResponse)
            ? playlistsResponse
            : (playlistsResponse.results || []);
          const statusPlaylists = ['Watched', 'Watching', 'To Watch', 'Did Not Finish'];
          for (const playlistName of statusPlaylists) {
            const playlist = allPlaylists.find(p => p.title === playlistName && p.is_status_playlist);
            if (playlist) {
              const itemsResponse = await playlistService.getPlaylistItems(playlist.id);
              const items = Array.isArray(itemsResponse)
                ? itemsResponse
                : (itemsResponse.results || []);
              const isInPlaylist = items.some(item =>
                item.movie?.id === movieDetails?.id ||
                item.movie?.tmdb_id === tmdbIdentifier ||
                item.movie?.id === movie?.id
              );
              if (isInPlaylist) return playlistName;
            }
          }
          return '';
        } catch (e) {
          return '';
        }
      };

      let effectiveStatus = await getBackendWatchStatus();
      // Prompt if status is 'To Watch', 'Watching', or not set at all
      if (effectiveStatus === 'To Watch' || effectiveStatus === 'Watching' || !effectiveStatus) {
        setDecisionModal({
          visible: true,
          title: 'Update Watch Status',
          message: 'Did you finish watching it or did you not continue?',
          onYes: async () => {
            setDecisionModal(modal => ({ ...modal, visible: false }));
            await handleSetStatus('Watched');
          },
          onNo: async () => {
            setDecisionModal(modal => ({ ...modal, visible: false }));
            await handleSetStatus('Did Not Finish');
          },
          onCancel: () => setDecisionModal(modal => ({ ...modal, visible: false })),
        });
      }

      console.log('[MovieDetailScreen] Review submitted successfully');
      showToast('Review submitted successfully!', 'success');

      // Reload only user's review (pass mediaType for correct lookup)
      const review = await reviewService.getUserReview({ tmdbId: tmdbIdentifier, mediaType: type });
      setUserReview(review);
      setUserRating(review?.rating || 0);
      setReviewText(review?.review_text || '');
      setShowReviewModal(false);
    } catch (error) {
      console.log('[MovieDetailScreen] Review submission error:', error.message);
      console.log('[MovieDetailScreen] Error formatted message:', error.formattedMessage);
      showToast('Failed to submit review: ' + (error.formattedMessage || error.message), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    const doDelete = async () => {
      try {
        console.log('[MovieDetailScreen] Attempting delete', {
          reviewId: userReview?.id,
          tmdbId: resolveTmdbId(),
          movieId: userReview?.movie || movieDetails?.id || movie?.id,
        });

        await reviewService.deleteReview({
          reviewId: userReview?.id,
          tmdbId: resolveTmdbId(),
          movieId: userReview?.movie || movieDetails?.id || movie?.id,
        });

        showToast('Review deleted', 'success');
        setUserReview(null);
        setUserRating(0);
        setReviewText('');

        // Confirm removal by refetching
        const refreshed = await reviewService.getUserReview({
          tmdbId: resolveTmdbId(),
          movieId: movieDetails?.id || movie?.id,
        });
        if (!refreshed) {
          setUserReview(null);
        } else {
          console.warn('[MovieDetailScreen] Review still present after delete attempt', refreshed);
        }
      } catch (error) {
        console.error('[MovieDetailScreen] Delete review error:', error.response?.data || error.message || error);
        const formatted = error.formattedMessage || error.response?.data?.error || error.message;
        showToast(`Failed to delete review${formatted ? `: ${formatted}` : ''}`, 'error');
      }
    };

    // On web, run delete without Alert (native alert can be flaky on web)
    if (Platform.OS === 'web') {
      doDelete();
      return;
    }

    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: doDelete,
      }
    ]);
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      showToast('Please sign in to add favorites', 'error');
      navigation.navigate('Sign In');
      return;
    }

    setLoadingFavorite(true);
    try {
      const tmdb = resolveTmdbId();
      const type = resolveMediaType();

      console.log('[handleToggleFavorite] TMDB ID:', tmdb, 'Type:', type, 'isFavorite:', isFavorite);

      if (!tmdb) {
        showToast('Movie information is missing', 'error');
        setLoadingFavorite(false);
        return;
      }

      if (isFavorite) {
        console.log('[handleToggleFavorite] Removing favorite...');
        await favoriteService.removeFavoriteByTmdb(tmdb);
        setIsFavorite(false);
        showToast('Removed from favorites', 'success');
      } else {
        console.log('[handleToggleFavorite] Adding favorite...');
        await favoriteService.addFavorite(tmdb, type);
        setIsFavorite(true);
        showToast('Added to favorites ❤️', 'success');
      }
    } catch (error) {
      console.error('[handleToggleFavorite] Failed to update favorites:', error);
      console.error('[handleToggleFavorite] Error details:', error.response?.data);
      showToast(error.formattedMessage || error.message || 'Failed to update favorites', 'error');
    } finally {
      setLoadingFavorite(false);
    }
  };

  const [decisionModal, setDecisionModal] = useState({
    visible: false,
    title: '',
    message: '',
    onYes: null,
    onNo: null,
    onCancel: null,
  });

  useEffect(() => {
    if (route.params?.statusUpdated) {
      // Wait for movieDetails to be loaded before reloading status
      if (!movieDetails) return;
      const reloadStatus = async () => {
        if (!isLoggedIn) return;
        try {
          const tmdbId = resolveTmdbId();
          if (!tmdbId) {
            setWatchStatus('');
            return;
          }
          const playlistsResponse = await playlistService.getPlaylists();
          const allPlaylists = Array.isArray(playlistsResponse)
            ? playlistsResponse
            : (playlistsResponse.results || []);
          const statusPlaylists = ['Watched', 'Watching', 'To Watch', 'Did Not Finish'];
          for (const playlistName of statusPlaylists) {
            const playlist = allPlaylists.find(p => p.title === playlistName && p.is_status_playlist);
            if (playlist) {
              const itemsResponse = await playlistService.getPlaylistItems(playlist.id);
              const items = Array.isArray(itemsResponse)
                ? itemsResponse
                : (itemsResponse.results || []);
              const isInPlaylist = items.some(item =>
                item.movie?.id === movieDetails?.id ||
                item.movie?.tmdb_id === tmdbId ||
                item.movie?.id === movie?.id
              );
              if (isInPlaylist) {
                setWatchStatus(playlistName);
                return;
              }
            }
          }
          setWatchStatus('');
        } catch (error) {
          console.error('[MovieDetailScreen] Failed to reload watch status:', error);
        }
      };
      reloadStatus();
      // Remove the param so it doesn't reload again
      navigation.setParams({ ...route.params, statusUpdated: false });
    }
  }, [route.params?.statusUpdated, isLoggedIn, movieDetails]);

  if (loading) {
    return (
      <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.loadingText, { color: colors.textSecondary }]}>Loading details...</Text>
      </View>
    );
  };

  if (error || !movieDetails) {
    return (
      <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.errorTitle}>Error</Text>
        </View>
        <View style={styles.errorContent}>
          <Text style={globalStyles.errorText}>{error || 'No movie data available.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}> 
      <DecisionModal
        visible={decisionModal.visible}
        title={decisionModal.title}
        message={decisionModal.message}
        onYes={decisionModal.onYes}
        onNo={decisionModal.onNo}
        onCancel={decisionModal.onCancel}
      />
      {/* Close button in header - upper right */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movieDetails.title}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CustomScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: Dimensions.get('window').height }}>
        {/* Backdrop Image or Trailer Video */}
        {trailerUrl ? (
          <View style={styles.backdropVideo}>
            {typeof document !== 'undefined' && (
              <iframe
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                src={`${trailerUrl}?autoplay=1&mute=1&controls=1`}
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            )}
            {loadingTrailer && (
              <View style={styles.trailerLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
        ) : movieDetails.backdrop_path ? (
          <Image
            source={{ uri: movieDetails.backdrop_path }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.backdropPlaceholder}>
              <Ionicons 
              name={movieDetails.type === 'movie' ? 'film' : 'tv'} 
              size={64} 
              color={colors.textSecondary} 
            />
          </View>
        )}

        {/* Poster and Basic Info */}
        <View style={styles.posterSection}>
          {movieDetails.poster_path ? (
            <Image
              source={{ uri: movieDetails.poster_path }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Ionicons 
                name={movieDetails.type === 'movie' ? 'film' : 'tv'} 
                size={48} 
                color={colors.textSecondary} 
              />
            </View>
          )}
          
          <View style={styles.basicInfo}>
            <Text style={styles.title}>{movieDetails.title}</Text>
            <Text style={styles.tagline}>{movieDetails.tagline}</Text>
            
            <Text style={styles.type}>
              {movieDetails.type && (movieDetails.type.toLowerCase() === 'series' || movieDetails.type.toLowerCase() === 'tv')
                ? 'SERIES'
                : 'FILM'}
            </Text>
            <Text style={styles.year}>{movieDetails.year}</Text>
            
            {/* Favorite Button */}
            {isLoggedIn && (
              <TouchableOpacity 
                style={styles.favoriteButton} 
                onPress={handleToggleFavorite}
                disabled={loadingFavorite}
              >
                <Ionicons 
                  name={isFavorite ? 'heart' : 'heart-outline'} 
                  size={28} 
                  color={isFavorite ? colors.error : colors.text} 
                />
                <Text style={[styles.favoriteText, { color: isFavorite ? colors.error : colors.text }]}>
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons - Only for logged in users */}
        {isLoggedIn && (
          <View style={styles.actions}>
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'To Watch' && styles.statusActive]}
                onPress={() => handleSetStatus('To Watch')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'To Watch' && styles.statusActiveText]}>
                  To Watch
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'Watching' && styles.statusActive]}
                onPress={() => handleSetStatus('Watching')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'Watching' && styles.statusActiveText]}>
                  Watching
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'Watched' && styles.statusActive]}
                onPress={() => handleSetStatus('Watched')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'Watched' && styles.statusActiveText]}>
                  Watched
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'Did Not Finish' && styles.statusActive]}
                onPress={() => handleSetStatus('Did Not Finish')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'Did Not Finish' && styles.statusActiveText]}>
                  Did Not Finish
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToList}>
              <Text style={styles.addButtonText}>Add to List</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details Section */}
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.description}>
            {movieDetails.overview || 'No description available.'}
          </Text>
          
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {movieDetails.type && (movieDetails.type.toLowerCase() === 'series' || movieDetails.type.toLowerCase() === 'tv')
                  ? 'Series'
                  : 'Film'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{movieDetails.status}</Text>
            </View>
            
            {isLoggedIn && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Rating</Text>
                <View style={styles.ratingDisplay}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={styles.infoValue}> {movieDetails.rating}/5</Text>
                </View>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Runtime</Text>
              <Text style={styles.infoValue}>{formatRuntime(movieDetails.runtime)}</Text>
            </View>
            
            {movieDetails.type === 'Series' ? (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Seasons</Text>
                  <Text style={styles.infoValue}>{movieDetails.seasons}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Episodes</Text>
                  <Text style={styles.infoValue}>{movieDetails.episodes}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Budget</Text>
                  <Text style={styles.infoValue}>{formatCurrency(movieDetails.budget)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Revenue</Text>
                  <Text style={styles.infoValue}>{formatCurrency(movieDetails.revenue)}</Text>
                </View>
              </>
            )}
          </View>
          
          {/* Genres */}
          {movieDetails.genres && movieDetails.genres.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {movieDetails.genres.map((genre, index) => (
                  <View key={genre.id || index} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* User Review Section (Privacy-Focused) */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>My Review</Text>
            {isLoggedIn && (
              <TouchableOpacity
                style={styles.leaveReviewButton}
                onPress={() => setShowReviewModal(true)}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={styles.leaveReviewButtonText}>
                  {userReview ? 'Edit' : 'Add Review'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {userReview ? (
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewUsername}>Your Review</Text>
                  <View style={styles.reviewStars}>
                    {[...Array(5)].map((_, i) => (
                      <Text key={i} style={styles.star}>
                        {i < userReview.rating ? '⭐' : '☆'}
                      </Text>
                    ))}
                  </View>
                  <Text style={[styles.reviewDate, { fontSize: 12, color: colors.textSecondary, marginTop: 8 }]}> 
                    {new Date(userReview.created_at).toLocaleDateString()} at {new Date(userReview.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {isLoggedIn && (
                  <TouchableOpacity
                    onPress={handleDeleteReview}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
              {userReview.review_text ? (
                <Text style={styles.reviewText}>{userReview.review_text}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noReviewsText}>
              {`You haven't reviewed this ${resolveMediaType() === 'tv' ? 'series' : 'film'} yet`}
            </Text>
          )}
        </View>
        
        {/* Extra padding at bottom */}
        <View style={{ height: 50 }} />
      </CustomScrollView>

      {/* Playlist Selection Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowPlaylistModal(false);
          setShowCreatePlaylistInput(false);
          setNewPlaylistName('');
          setNewPlaylistDescription('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Playlist</Text>
              <TouchableOpacity onPress={() => {
                setShowPlaylistModal(false);
                setShowCreatePlaylistInput(false);
                setNewPlaylistName('');
                setNewPlaylistDescription('');
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.createPlaylistSection}>
              {!showCreatePlaylistInput ? (
                <TouchableOpacity
                  style={styles.createPlaylistButton}
                  onPress={() => setShowCreatePlaylistInput(true)}
                >
                  <Ionicons name="add-circle" size={20} color={colors.primary} />
                  <Text style={styles.createPlaylistButtonText}>Create New Playlist</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.createPlaylistInputContainer}>
                  <TextInput
                    style={styles.createPlaylistInput}
                    placeholder="Enter playlist name"
                    placeholderTextColor={colors.textSecondary}
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    autoFocus
                  />
                  <TextInput
                    style={[styles.createPlaylistInput, { height: 80, marginTop: 12 }]}
                    placeholder="Enter description (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={newPlaylistDescription}
                    onChangeText={setNewPlaylistDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.createPlaylistActions}>
                    <TouchableOpacity
                      style={styles.createCancelButton}
                      onPress={() => {
                        setShowCreatePlaylistInput(false);
                        setNewPlaylistName('');
                        setNewPlaylistDescription('');
                      }}
                    >
                      <Text style={styles.createCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.createConfirmButton,
                        !newPlaylistName.trim() && styles.createConfirmButtonDisabled
                      ]}
                      onPress={handleCreateNewPlaylist}
                      disabled={!newPlaylistName.trim() || loadingPlaylists}
                    >
                      <Text style={styles.createConfirmText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <Text style={styles.modalSubtitle}>Or select existing playlist:</Text>

            {loadingPlaylists ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.playlistItem}
                    onPress={() => handleSelectPlaylist(item.id)}
                  >
                    <Ionicons name="list" size={24} color={colors.primary} />
                    <View style={styles.playlistInfo}>
                      <Text style={styles.playlistName}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.playlistDescription}>{item.description}</Text>
                      )}
                      <Text style={styles.playlistStats}>{item.movie_count || 0} items</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No playlists found</Text>
                    <Text style={styles.emptySubtext}>Create your first playlist using the option above!</Text>
                  </View>
                )}
                style={styles.playlistList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowReviewModal(false);
          setUserRating(0);
          setReviewText('');
        }}
      >
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
          <View style={[styles.modalContent, { borderRadius: 20, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {userReview ? 'Edit Review' : 'Leave a Review'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowReviewModal(false);
                setUserRating(0);
                setReviewText('');
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.reviewModalContent} showsVerticalScrollIndicator={false}>
              {/* Movie info */}
              <View style={styles.reviewMovieInfo}>
                {movieDetails.poster_path && (
                  <Image
                    source={{ uri: movieDetails.poster_path }}
                    style={styles.reviewMoviePoster}
                  />
                )}
                <View style={styles.reviewMovieDetails}>
                  <Text style={styles.reviewMovieTitle} numberOfLines={2}>
                    {movieDetails.title}
                  </Text>
                  <Text style={styles.reviewMovieYear}>
                    {movieDetails.year || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Rating Stars */}
              <View style={styles.ratingSection}>
                <Text style={styles.ratingLabel}>Your Rating</Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setUserRating(star)}
                      style={styles.starButton}
                    >
                      <Text style={styles.ratingStarIcon}>
                        {userRating >= star ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {userRating > 0 && (
                  <Text style={styles.ratingText}>{userRating} out of 5 stars</Text>
                )}
              </View>

              {/* Review Text */}
              <View style={styles.reviewTextSection}>
                <Text style={styles.reviewTextLabel}>Your Review (Optional)</Text>
                <TextInput
                  style={styles.reviewTextInput}
                  placeholder="Share your thoughts about this movie..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={5}
                  value={reviewText}
                  onChangeText={setReviewText}
                  maxLength={500}
                />
                <Text style={styles.charCount}>
                  {reviewText.length}/500
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.reviewButtonsContainer}>
                <TouchableOpacity
                  style={[styles.submitButton, { opacity: userRating === 0 ? 0.5 : 1 }]}
                  onPress={handleSubmitReview}
                  disabled={submittingReview || userRating === 0}
                >
                  {submittingReview ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {userReview ? 'Update Review' : 'Submit Review'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Delete button removed here; delete exists next to review card */}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {toast.visible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  backdropImage: {
    width: '100%',
    height: 400,
  },
  backdropVideo: {
    width: '100%',
    height: 400,
    position: 'relative',
    backgroundColor: '#000',
  },
  trailerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backdropPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 20,
    backgroundColor: colors.card,
    marginTop: -50,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  posterPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 8,
  },
  voteCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  type: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  statusActiveText: {
    color: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingBottom: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playlistStats: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 20,
    fontSize: 16,
  },
  createPlaylistSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createPlaylistButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  createPlaylistInputContainer: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
  },
  createPlaylistInput: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  createPlaylistActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  createCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  createConfirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  createConfirmButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  createConfirmText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSubtitle: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playlistList: {
    maxHeight: 300,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStatusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  progressStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  progressStatusPillActive: {
    borderColor: colors.primary,
  },
  progressStatusText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  progressStatusTextActive: {
    color: colors.primary,
  },
  progressInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressInputItem: {
    flex: 1,
  },
  progressInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  progressStarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
  },
  progressNotes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    color: colors.text,
    backgroundColor: colors.surface,
    marginTop: 6,
  },
  saveProgressButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveProgressText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: {
    color: colors.text,
    fontSize: 12,
  },
  progressSelect: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressSelectText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectWithClear: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOverlaySimple: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 16,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  playlistList: {
    maxHeight: 300,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Review styles
  reviewsSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leaveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  leaveReviewButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reviewsList: {
    gap: 12,
  },
  reviewItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  deleteReviewButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  deleteReviewText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUsername: {
    fontWeight: '600',
    color: colors.text,
    fontSize: 14,
  },
  reviewStars: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  star: {
    fontSize: 14,
    color: '#fff',
  },
  reviewDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  reviewText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
  },
  // Review Modal styles
  reviewModalContent: {
    padding: 16,
  },
  reviewMovieInfo: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  reviewMoviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  reviewMovieDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  reviewMovieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  reviewMovieYear: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  ratingStarIcon: {
    fontSize: 40,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  reviewTextSection: {
    marginBottom: 20,
  },
  reviewTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  reviewButtonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  favoriteText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MovieDetailScreen;