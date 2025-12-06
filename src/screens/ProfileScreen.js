// src/screens/ProfileScreen.js - UPDATED (Removed Tracking Section)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { playlistService } from '../services/playlistService';
import { reviewService } from '../services/reviewService';
import { movieService } from '../services/movieService';
import { favoriteService } from '../services/favoriteService';

const ProfileScreen = ({ navigation }) => {
  const { currentUser, isLoggedIn, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
  const [watchingItems, setWatchingItems] = useState([]);
  const [latestReviews, setLatestReviews] = useState([]);
  const [reviewsByMovie, setReviewsByMovie] = useState({}); // keyed by tmdb_id
  const [queueItems, setQueueItems] = useState([]); // To Watch + Watching combined
  const [dnfItems, setDnfItems] = useState([]); // Did Not Finish
  const [allWatchlistItems, setAllWatchlistItems] = useState([]); // All statuses combined
  const [allWatchedItems, setAllWatchedItems] = useState([]);
  const [watchlistTab, setWatchlistTab] = useState('queue');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    filmsWatched: 0,
    seriesWatched: 0,
    watchedThisYear: 0,
    listsMade: 0,
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [allFilms, setAllFilms] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [favoriteFilms, setFavoriteFilms] = useState([]);
  const [favoriteSeries, setFavoriteSeries] = useState([]);
  const [favoriteSubTab, setFavoriteSubTab] = useState('films');
  const [reviewMetaByMovie, setReviewMetaByMovie] = useState({}); // keyed by tmdb_id
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const handleClose = React.useCallback(() => {
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }, [navigation]);

  useEffect(() => {
    if (isLoggedIn) {
      loadProfileData();
    }
  }, [isLoggedIn]);

  // Reload favorites when Profile tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isLoggedIn) {
        // Reload the full profile data when screen comes into focus
        loadProfileData();
      }
    }, [isLoggedIn])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadProfileData();
      showToast('Lists updated!', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh lists', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'watching':
        return 'Watching';
      case 'watched':
        return 'Watched';
      case 'did_not_finish':
        return 'Did Not Finish';
      default:
        return 'To Watch';
    }
  };

  const getStatusColors = (status) => {
    if (status === 'watching') {
      return { background: colors.primary, text: '#fff' };
    }
    if (status === 'did_not_finish') {
      return { background: colors.error, text: '#fff' };
    }
    return { background: colors.card, text: colors.text };
  };

  const renderWatchlistGrid = (items, emptyText) => {
    if (!items || items.length === 0) {
      return <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{emptyText}</Text>;
    }

    return (
      <View style={styles.gridContainer}>
        {items.map((item) => {
          const movie = item.movie || {};
          const key = item.id || movie.id || movie.tmdb_id;
          const { background, text } = getStatusColors(item.status);
          const statusLabel = getStatusLabel(item.status);
          const rating = reviewsByMovie[movie.tmdb_id] || reviewsByMovie[movie.id];

          return (
            <TouchableOpacity
              key={key}
              style={styles.gridItem}
              onPress={() => navigation.navigate('MovieDetail', { movieId: movie.tmdb_id || movie.id, mediaType: movie.media_type })}
            >
              {movie.poster_url ? (
                <Image source={{ uri: movie.poster_url }} style={styles.gridPoster} />
              ) : (
                <View style={[styles.gridPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name={movie.media_type === 'tv' ? 'tv' : 'film'} size={40} color={colors.textSecondary} />
                </View>
              )}
              <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{movie.title}</Text>
              {statusLabel && (
                <View style={[styles.statusBadge, { backgroundColor: background }]}>
                  <Text style={[styles.statusBadgeText, { color: text }]}>{statusLabel}</Text>
                </View>
              )}
              {rating && (
                <View style={styles.ratingRow}>
                  {[...Array(5)].map((_, i) => (
                    <Text key={i} style={styles.miniStar}>
                      {i < rating ? '⭐' : '☆'}
                    </Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const playlistsResponse = await playlistService.getPlaylists();
      const playlistsArray = Array.isArray(playlistsResponse) ? playlistsResponse : playlistsResponse.results || [];

      // Pin only To Watch, Watching, Watched at the top; DNF and user lists sort by updated_at
      const pinnedStatusOrder = ['To Watch', 'Watching', 'Watched'];
      const sortedPlaylists = [...playlistsArray].sort((a, b) => {
        const aIsPinned = pinnedStatusOrder.includes(a.title);
        const bIsPinned = pinnedStatusOrder.includes(b.title);
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
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
      
      console.log('[ProfileScreen] Playlists before sort:', playlistsArray.map(p => ({ title: p.title, is_status: p.is_status_playlist })));
      console.log('[ProfileScreen] Playlists after sort:', sortedPlaylists.map(p => ({ title: p.title, is_status: p.is_status_playlist })));
      
      setPlaylists(sortedPlaylists);

      const watchedPlaylist = playlistsArray.find(p => p.title === 'Watched');
      const toWatchPlaylist = playlistsArray.find(p => p.title === 'To Watch');
      const watchingPlaylist = playlistsArray.find(p => p.title === 'Watching');
      const dnfPlaylist = playlistsArray.find(p => p.title === 'Did Not Finish');
      let toWatchItemsData = [];
      let watchingItemsData = [];
      let dnfItemsData = [];
      let watchedItemsAll = [];
      let filmsFromWatched = [];
      let seriesFromWatched = [];
      
      if (watchedPlaylist) {
        const itemsResponse = await playlistService.getPlaylistItems(watchedPlaylist.id);
        const itemsArray = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.results || [];
        watchedItemsAll = itemsArray;
        console.log('[ProfileScreen] Watched items:', itemsArray);
        itemsArray.forEach((item, idx) => {
          const mediaType = item.movie?.media_type;
          const title = item.movie?.title;
          const movieId = item.movie?.id;
          const tmdbId = item.movie?.tmdb_id;
          console.log(`[ProfileScreen] Item ${idx}:`, { 
            title, 
            media_type: mediaType, 
            status: item.status, 
            movieId,
            tmdbId
          });
        });
        setWatchedItems(itemsArray.slice().reverse().slice(0, 3));
        setAllWatchedItems(itemsArray);
        
        // Separate films and series
        filmsFromWatched = itemsArray.filter(item => item.movie?.media_type === 'movie');
        seriesFromWatched = itemsArray.filter(item => item.movie?.media_type === 'tv');
        
        // Log any items that don't match either category
        const unclassified = itemsArray.filter(item => 
          item.movie?.media_type !== 'movie' && item.movie?.media_type !== 'tv'
        );
        if (unclassified.length > 0) {
          console.log('[ProfileScreen] ⚠️ Unclassified items (not movie or tv):', unclassified);
        }
        
        setAllFilms(filmsFromWatched);
        setAllSeries(seriesFromWatched);
      }

      if (toWatchPlaylist) {
        const itemsResponse = await playlistService.getPlaylistItems(toWatchPlaylist.id);
        toWatchItemsData = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.results || [];
      }

      if (watchingPlaylist) {
        const itemsResponse = await playlistService.getPlaylistItems(watchingPlaylist.id);
        watchingItemsData = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.results || [];
        // Show up to 5 watching items
        setWatchingItems(watchingItemsData.slice(0, 5));
      }

      if (dnfPlaylist) {
        const itemsResponse = await playlistService.getPlaylistItems(dnfPlaylist.id);
        dnfItemsData = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.results || [];
        setDnfItems(dnfItemsData);
      } else {
        setDnfItems([]);
      }

      // Combine To Watch + Watching (deduped by movie id)
      const combinedStatusItems = {};
      [...toWatchItemsData, ...watchingItemsData].forEach(item => {
        const movieId = item.movie?.id;
        if (!movieId) return;
        // Watching overrides To Watch if both exist (shouldn't happen due to exclusivity)
        combinedStatusItems[movieId] = item;
      });
      
      // Sort queue items: Watching first, then To Watch, both sorted by updated_at (most recent first)
      const sortedQueueItems = Object.values(combinedStatusItems).sort((a, b) => {
        // Watching comes before To Watch
        if (a.status === 'watching' && b.status !== 'watching') return -1;
        if (a.status !== 'watching' && b.status === 'watching') return 1;
        
        // Within same status, sort by updated_at (most recent first)
        const aTime = new Date(a.updated_at || a.added_at).getTime();
        const bTime = new Date(b.updated_at || b.added_at).getTime();
        return bTime - aTime;
      });
      setQueueItems(sortedQueueItems);

      // Build All Watchlist (all status playlists combined, deduped by movie ID)
      const allWatchlistMap = {};
      [...watchedItemsAll, ...toWatchItemsData, ...watchingItemsData, ...dnfItemsData].forEach(item => {
        const movieId = item.movie?.id;
        if (!movieId) return;
        allWatchlistMap[movieId] = item;
      });
      const allWatchlistList = Object.values(allWatchlistMap).sort((a, b) => {
        // Status priority: to_watch, watching, watched, then others (like dnf)
        const statusPriority = { to_watch: 0, watching: 1, watched: 2 };
        const aPriority = statusPriority[a.status] ?? 999; // Non-pinned statuses go to end
        const bPriority = statusPriority[b.status] ?? 999;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Within same priority, sort by updated_at (most recent first)
        const aTime = new Date(a.updated_at || a.added_at).getTime();
        const bTime = new Date(b.updated_at || b.added_at).getTime();
        return bTime - aTime;
      });
      setAllWatchlistItems(allWatchlistList);

      // Load latest reviews
      const reviews = await reviewService.getUserReviews();
      setLatestReviews(Array.isArray(reviews) ? reviews.slice(0, 5) : []);
      
      // Create a map of movie ID to rating for quick lookup
      const allReviews = Array.isArray(reviews) ? reviews : [];
      const reviewsMap = {}; // composite: `${tmdb_id||movieId}-${media_type}` -> rating
      const metaMap = {};    // composite key -> {title, media_type, tmdb_id, poster_url}

      await Promise.all(allReviews.map(async (review) => {
        const movieObj = typeof review.movie === 'object' ? review.movie : null;
        const movieId = movieObj?.id || review.movie;
        let tmdbId = review.tmdb_id || movieObj?.tmdb_id;
        let title = review.movie_title || review.title || movieObj?.title;
        let mediaType = review.media_type || movieObj?.media_type || 'movie';
        let posterUrl = review.movie_poster || movieObj?.poster_url;

        // If anything critical missing, fetch by movieId
        if ((!tmdbId || !title || !mediaType || !posterUrl) && movieId) {
          try {
            const mv = await movieService.getMovieById(movieId);
            tmdbId = tmdbId || mv?.tmdb_id;
            title = title || mv?.title;
            mediaType = mediaType || mv?.media_type || 'movie';
            posterUrl = posterUrl || mv?.poster_url;
          } catch (err) {
            console.warn('[ProfileScreen] Failed to fetch movie meta for review', movieId, err);
          }
        }

        const key = tmdbId ? `${tmdbId}-${mediaType || 'movie'}` : movieId ? `${movieId}-${mediaType || 'movie'}` : null;
        if (!key) return;

        console.log('[ProfileScreen] Adding rating key:', key, 'rating:', review.rating, 'mediaType:', mediaType, 'tmdbId:', tmdbId);

        reviewsMap[key] = review.rating;

        if (!metaMap[key]) {
          metaMap[key] = {
            title,
            media_type: mediaType,
            tmdb_id: tmdbId,
            poster_url: posterUrl,
          };
        }
      }));

      console.log('[ProfileScreen] Final reviewsMap:', reviewsMap);
      console.log('[ProfileScreen] Final metaMap:', metaMap);

      setReviewsByMovie(reviewsMap);
      setReviewMetaByMovie(metaMap);

      // Load favorites
      const favoritesResponse = await favoriteService.getFavorites();
      const favoritesArray = favoritesResponse.results || (Array.isArray(favoritesResponse) ? favoritesResponse : []);
      setFavoriteFilms(favoritesArray.filter(fav => fav.movie?.media_type === 'movie'));
      setFavoriteSeries(favoritesArray.filter(fav => fav.movie?.media_type === 'tv'));

      // Compute stats
      const currentYear = new Date().getFullYear();
      console.log('[ProfileScreen] Computing stats from watchedItemsAll:', watchedItemsAll);
      console.log('[ProfileScreen] watchedItemsAll length:', watchedItemsAll.length);
      
      // Use the local variables that were just computed above
      const filmsWatched = filmsFromWatched.length;
      const seriesWatched = seriesFromWatched.length;
      
      console.log('[ProfileScreen] Film count:', filmsWatched, 'Series count:', seriesWatched);
      
      const watchedThisYear = watchedItemsAll.filter(item => {
        const year = item.added_at ? new Date(item.added_at).getFullYear() : null;
        return year === currentYear;
      }).length;
      const listsMade = playlistsArray.filter(p => !p.is_status_playlist).length;

      setStats({ filmsWatched, seriesWatched, watchedThisYear, listsMade });
    } catch (error) {
      console.error('❌ Failed to load profile data:', error);
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('ProfileScreen: handleSignOut triggered');
    // On web, use modal instead of Alert for better reliability
    if (Platform.OS === 'web') {
      setShowSignOutModal(true);
    } else {
      // On native, use traditional Alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              await confirmSignOut();
            }
          }
        ]
      );
    }
  };

  const confirmSignOut = async () => {
    try {
      console.log('ProfileScreen: User confirmed sign out');
      setShowSignOutModal(false);
      
      // Sign out
      await signOut();
      console.log('ProfileScreen: Sign out complete, navigating to Home');
      
      // Reset navigation after a small delay to ensure state is updated
      setTimeout(() => {
        console.log('ProfileScreen: Resetting navigation to Home');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 200);
    } catch (err) {
      console.error('ProfileScreen: Sign out error:', err);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleHelpSupport = () => {
    navigation.navigate('HelpSupport');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleReviewPress = async (review) => {
    try {
      setLoading(true);

      const movieObj = typeof review.movie === 'object' ? review.movie : null;
      const movieId = movieObj?.id || review.movie;
      const mediaType = review.media_type || movieObj?.media_type || 'movie';
      const key = review.tmdb_id ? `${review.tmdb_id}-${mediaType}` : movieId ? `${movieId}-${mediaType}` : null;

      // Prefer direct metadata from review/meta map
      const meta = (key && reviewMetaByMovie[key]) || {};
      const tmdbId = review.tmdb_id || movieObj?.tmdb_id || meta.tmdb_id;
      const type = review.media_type || movieObj?.media_type || meta.media_type || mediaType || 'movie';

      let resolvedTmdb = tmdbId;
      let resolvedType = type;
      let resolvedMovieId = movieId;

      if (!resolvedTmdb || !resolvedType) {
        const movie = await movieService.getMovieById(movieId);
        resolvedTmdb = resolvedTmdb || movie?.tmdb_id;
        resolvedType = resolvedType || movie?.media_type || 'movie';
        resolvedMovieId = movie?.id || movieId;
      }

      if (!resolvedTmdb) {
        showToast('Unable to open this review. Missing movie data.', 'error');
        return;
      }

      navigation.navigate('MovieDetail', {
        tmdbId: resolvedTmdb,
        movieId: resolvedMovieId,
        mediaType: resolvedType,
        openReviewModal: true,
      });
    } catch (error) {
      console.error('Failed to open review from profile:', error);
      showToast('Could not open review. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[globalStyles.logo, { color: colors.primary }]}>TrackR</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.notLoggedInTitle, { color: colors.text }]}>Not Signed In</Text>
          <Text style={[styles.notLoggedInText, { color: colors.textSecondary }]}>
            Please sign in to access your profile
          </Text>
          <TouchableOpacity 
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Sign In')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.guestButton, { borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleClose}
          >
            <Text style={[styles.guestButtonText, { color: colors.text }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[globalStyles.logo, { color: colors.primary }]}>TrackR</Text>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CustomScrollView
        style={[globalStyles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={globalStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.username, { color: colors.text }]}>Your activity</Text>

          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[{
              label: 'Films',
              value: stats.filmsWatched,
            }, {
              label: 'Series',
              value: stats.seriesWatched,
            }, {
              label: 'This Year',
              value: stats.watchedThisYear,
            }, {
              label: 'Watchlists',
              value: stats.listsMade,
            }].map((item, idx) => (
              <View key={idx} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
          {[
            { key: 'profile', label: 'Profile' }, 
            { key: 'films', label: 'Films' }, 
            { key: 'series', label: 'Series' }, 
            { key: 'queue', label: 'Watchlist' },
            { key: 'lists', label: 'Lists' }, 
            { key: 'favorites', label: 'Favorite' },
            { key: 'reviews', label: 'Reviews' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
                { borderBottomColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
              ]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
        {/* Favorite Films Section */}
        {!loading && (
          <View style={[styles.section, { backgroundColor: colors.background }]}> 
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Films</Text>
            </View>
            {favoriteFilms.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.watchedList}>
                {favoriteFilms.slice(0, 8).map((fav) => (
                  <TouchableOpacity
                    key={fav.id}
                    style={styles.watchedItem}
                    onPress={() => navigation.navigate('MovieDetail', { movieId: fav.movie.tmdb_id, mediaType: 'movie' })}
                  >
                    {fav.movie.poster_url ? (
                      <Image
                        source={{ uri: fav.movie.poster_url }}
                        style={styles.watchedPoster}
                      />
                    ) : (
                      <View style={[styles.watchedPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="film" size={60} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.watchedTitle, { color: colors.text }]} numberOfLines={2}>
                      {fav.movie.title}
                    </Text>
                    {(() => {
                      const ratingKey = fav.movie?.tmdb_id ? `${fav.movie.tmdb_id}-${fav.movie.media_type || 'movie'}` : null;
                      const rating = ratingKey ? reviewsByMovie[ratingKey] : null;
                      if (!rating) return null;
                      return (
                        <View style={styles.ratingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.miniStar}>
                              {i < rating ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      );
                    })()}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No favorite films added yet</Text>
            )}
          </View>
        )}

        {/* Favorite Series Section */}
        {!loading && (
          <View style={[styles.section, { backgroundColor: colors.background }]}> 
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Favorite Series</Text>
            </View>
            {favoriteSeries.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.watchedList}>
                {favoriteSeries.slice(0, 8).map((fav) => {
                  const ratingKey = fav.movie?.tmdb_id ? `${fav.movie.tmdb_id}-tv` : null;
                  const rating = ratingKey ? reviewsByMovie[ratingKey] : null;
                  return (
                    <TouchableOpacity
                      key={fav.id}
                      style={styles.watchedItem}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: fav.movie.tmdb_id, mediaType: 'tv' })}
                    >
                      {fav.movie.poster_url ? (
                        <Image
                          source={{ uri: fav.movie.poster_url }}
                          style={styles.watchedPoster}
                        />
                      ) : (
                        <View style={[styles.watchedPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="tv" size={60} color={colors.textSecondary} />
                        </View>
                      )}
                      <Text style={[styles.watchedTitle, { color: colors.text }]} numberOfLines={2}>
                        {fav.movie.title}
                      </Text>
                      {rating && (
                        <View style={styles.ratingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.miniStar}>
                              {i < rating ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No favorite series added yet</Text>
            )}
          </View>
        )}

        {/* Latest Watched Section */}
        {!loading && watchedItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Watched</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.watchedList}>
              {watchedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.watchedItem}
                  onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie.tmdb_id, mediaType: item.movie.media_type })}
                >
                  {item.movie.poster_url ? (
                    <Image
                      source={{ uri: item.movie.poster_url }}
                      style={styles.watchedPoster}
                    />
                  ) : (
                    <View style={[styles.watchedPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="film" size={60} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[styles.watchedTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.movie.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Currently Watching Section */}
        {!loading && watchingItems.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Currently Watching</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.watchedList}>
              {watchingItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.watchedItem}
                  onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie.tmdb_id, mediaType: item.movie.media_type })}
                >
                  {item.movie.poster_url ? (
                    <Image
                      source={{ uri: item.movie.poster_url }}
                      style={styles.watchedPoster}
                    />
                  ) : (
                    <View style={[styles.watchedPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="film" size={60} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[styles.watchedTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.movie.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Latest Reviews Section - Only show in profile tab */}
        {activeTab === 'profile' && latestReviews.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.background, marginBottom: 20 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Reviews</Text>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>{latestReviews.length}</Text>
            </View>
            {latestReviews.map((review) => {
              const movieObj = typeof review.movie === 'object' ? review.movie : null;
              const movieId = movieObj?.id || review.movie;
              const mediaType = review.media_type || movieObj?.media_type || 'movie';
              const key = review.tmdb_id ? `${review.tmdb_id}-${mediaType}` : movieId ? `${movieId}-${mediaType}` : null;
              const meta = (key && reviewMetaByMovie[key]) || {};
              const title = review.movie_title || review.title || movieObj?.title || meta.title || 'Untitled';
              const posterUrl = review.movie_poster || movieObj?.poster_url || meta.poster_url;
              return (
                <TouchableOpacity
                  key={review.id}
                  style={[styles.reviewCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
                  activeOpacity={0.8}
                  onPress={() => handleReviewPress(review)}
                >
                  <View style={styles.reviewCardHeader}>
                    {posterUrl ? (
                      <Image
                        source={{ uri: posterUrl }}
                        style={styles.reviewMoviePoster}
                      />
                    ) : (
                      <View style={[styles.reviewMoviePoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name={mediaType === 'tv' ? 'tv' : 'film'} size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={styles.reviewCardInfo}>
                      <Text style={[styles.reviewCardTitle, { color: colors.text }]} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={[styles.reviewCardSubtitle, { color: colors.textSecondary }]}>
                        {mediaType === 'tv' ? 'Series' : 'Film'}
                      </Text>
                      <View style={styles.reviewStarsRow}>
                        {[...Array(5)].map((_, i) => (
                          <Text key={i} style={styles.reviewStar}>
                            {i < review.rating ? '⭐' : '☆'}
                          </Text>
                        ))}
                      </View>
                      {review.review_text && (
                        <Text style={[styles.reviewCardText, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={2}>
                          {review.review_text}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Latest Episode Progress Section removed as requested */}
          </>
        )}

        {/* Films Tab Content */}
        {activeTab === 'films' && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 16, marginBottom: 16 }]}>All Films ({allFilms.length})</Text>
            {allFilms.length > 0 ? (
              <View style={styles.gridContainer}>
                {allFilms.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItem}
                    onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie.tmdb_id, mediaType: 'movie' })}
                  >
                    {item.movie.poster_url ? (
                      <Image source={{ uri: item.movie.poster_url }} style={styles.gridPoster} />
                    ) : (
                      <View style={[styles.gridPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="film" size={40} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>{item.movie.title}</Text>
                    {(() => {
                      const ratingKey = item.movie?.tmdb_id ? `${item.movie.tmdb_id}-${item.movie.media_type || 'movie'}` : null;
                      const rating = ratingKey ? reviewsByMovie[ratingKey] : null;
                      if (!rating) return null;
                      return (
                        <View style={styles.ratingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.miniStar}>
                              {i < rating ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      );
                    })()}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No films watched yet</Text>
            )}
          </View>
        )}

        {/* Series Tab Content */}
        {activeTab === 'series' && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 16, marginBottom: 16 }]}>All Series ({allSeries.length})</Text>
            {allSeries.length > 0 ? (
              <View style={styles.gridContainer}>
                {allSeries.map((item) => {
                  const ratingKey = item.movie?.tmdb_id ? `${item.movie.tmdb_id}-tv` : null;
                  const rating = ratingKey ? reviewsByMovie[ratingKey] : null;
                  console.log('[ProfileScreen Series] Item:', item.movie?.title, 'tmdbId:', item.movie?.tmdb_id, 'ratingKey:', ratingKey, 'rating:', rating, 'reviewsMap:', reviewsByMovie);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: item.movie.tmdb_id, mediaType: 'tv' })}
                    >
                      {item.movie.poster_url ? (
                        <Image source={{ uri: item.movie.poster_url }} style={styles.gridPoster} />
                      ) : (
                        <View style={[styles.gridPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="tv" size={40} color={colors.textSecondary} />
                        </View>
                      )}
                      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{item.movie.title}</Text>
                      {rating && (
                        <View style={styles.ratingRow}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.miniStar}>
                              {i < rating ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No series watched yet</Text>
            )}
          </View>
        )}

        {/* Many Watchlists Tab Content (To Watch + Watching) */}
        {activeTab === 'queue' && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <View style={styles.watchlistHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 16, marginBottom: 0 }]}>Watchlist</Text>
              <View style={styles.watchlistTabs}>
                {[{ key: 'all', label: 'All Watchlist' }, { key: 'queue', label: 'Queue' }, { key: 'dnf', label: 'Did Not Finish' }].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.watchlistTab,
                      { borderColor: colors.border, backgroundColor: watchlistTab === tab.key ? colors.primary : colors.card }
                    ]}
                    onPress={() => setWatchlistTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.watchlistTabText,
                      { color: watchlistTab === tab.key ? '#fff' : colors.text }
                    ]}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {watchlistTab === 'all' && renderWatchlistGrid(allWatchlistItems, 'No items in your watchlist yet')}
            {watchlistTab === 'queue' && renderWatchlistGrid(queueItems, 'No items in To Watch or Watching')}
            {watchlistTab === 'dnf' && renderWatchlistGrid(dnfItems, 'No Did Not Finish items yet')}
          </View>
        )}

        {/* Favorite Films Tab Content */}
        {/* Removed - now showing on profile tab */}

        {/* Favorite Series Tab Content */}
        {/* Removed - now showing on profile tab */}

        {/* Lists Tab Content */}
        {activeTab === 'lists' && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 8, marginRight: 8, marginBottom: 16 }}>
              <Text style={[styles.sectionTitle, { color: colors.text, margin: 0, marginLeft: 8 }]}>Your Lists</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={handleRefresh}
                  style={[styles.createListButton, { borderColor: colors.primary, opacity: isRefreshing ? 0.6 : 1 }]}
                  activeOpacity={0.7}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowCreateListModal(true)}
                  style={[styles.createListButton, { borderColor: colors.primary }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.createListButtonText, { color: colors.primary }]}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.id}
                style={[styles.playlistItem, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
                onPress={() => navigation.navigate('PlaylistDetail', { playlistId: playlist.id, playlistTitle: playlist.title })}
                activeOpacity={0.85}
              >
                <View style={styles.playlistIcon}>
                  <Ionicons name={playlist.is_status_playlist ? 'star' : 'list'} size={24} color={colors.primary} />
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={[styles.playlistTitle, { color: colors.text }]}>{playlist.title}</Text>
                  {playlist.description && (
                    <Text style={[styles.playlistDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                      {playlist.description}
                    </Text>
                  )}
                  <Text style={[styles.playlistCount, { color: colors.textSecondary }]}>
                    {playlist.movie_count || 0} item{(playlist.movie_count || 0) !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.playlistActions}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Favorite Tab Content */}
        {activeTab === 'favorites' && (
          <View style={[styles.section, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, margin: 0, marginLeft: 8 }]}>Your Favorites</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16, marginLeft: 16 }}
              contentContainerStyle={[styles.subTabScrollContent]}
            >
              {[{ key: 'films', label: 'Films' }, { key: 'series', label: 'Series' }].map((sub, idx, arr) => (
                <TouchableOpacity
                  key={sub.key}
                  style={[
                    styles.subTabChip,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    favoriteSubTab === sub.key && styles.activeSubTabChip,
                    idx < arr.length - 1 && { marginRight: 8 }
                  ]}
                  onPress={() => setFavoriteSubTab(sub.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      { color: colors.text },
                      favoriteSubTab === sub.key && { fontWeight: '700', textDecorationLine: 'underline' }
                    ]}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {favoriteSubTab === 'films' ? (
              favoriteFilms.length > 0 ? (
                <View style={styles.gridContainer}>
                  {favoriteFilms.map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: fav.movie.tmdb_id, mediaType: 'movie' })}
                    >
                      {fav.movie.poster_url ? (
                        <Image source={{ uri: fav.movie.poster_url }} style={styles.gridPoster} />
                      ) : (
                        <View style={[styles.gridPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="film" size={40} color={colors.textSecondary} />
                        </View>
                      )}
                      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={2}>{fav.movie.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No favorite films yet</Text>
              )
            ) : (
              favoriteSeries.length > 0 ? (
                <View style={styles.gridContainer}>
                  {favoriteSeries.map((fav) => (
                    <TouchableOpacity
                      key={fav.id}
                      style={styles.gridItem}
                      onPress={() => navigation.navigate('MovieDetail', { movieId: fav.movie.tmdb_id, mediaType: 'tv' })}
                    >
                      {fav.movie.poster_url ? (
                        <Image source={{ uri: fav.movie.poster_url }} style={styles.gridPoster} />
                      ) : (
                        <View style={[styles.gridPoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="tv" size={40} color={colors.textSecondary} />
                        </View>
                      )}
                      <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">{fav.movie.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No favorite series yet</Text>
              )
            )}
          </View>
        )}

        {/* Reviews Tab Content */}
        {activeTab === 'reviews' && (
          <View style={[styles.section, { backgroundColor: colors.background, marginBottom: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 16, marginBottom: 16 }]}>All Reviews ({latestReviews.length})</Text>
            {latestReviews.length > 0 ? (
              latestReviews.map((review) => {
                const movieObj = typeof review.movie === 'object' ? review.movie : null;
                const movieId = movieObj?.id || review.movie;
                const mediaType = review.media_type || movieObj?.media_type || 'movie';
                const key = review.tmdb_id ? `${review.tmdb_id}-${mediaType}` : movieId ? `${movieId}-${mediaType}` : null;
                const meta = (key && reviewMetaByMovie[key]) || {};
                const title = review.movie_title || review.title || movieObj?.title || meta.title || 'Untitled';
                const posterUrl = review.movie_poster || movieObj?.poster_url || meta.poster_url;
                return (
                  <TouchableOpacity
                    key={review.id}
                    style={[styles.reviewCard, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}
                    activeOpacity={0.8}
                    onPress={() => handleReviewPress(review)}
                  >
                    <View style={styles.reviewCardHeader}>
                      {posterUrl ? (
                        <Image source={{ uri: posterUrl }} style={styles.reviewMoviePoster} />
                      ) : (
                        <View style={[styles.reviewMoviePoster, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name={mediaType === 'tv' ? 'tv' : 'film'} size={16} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.reviewCardInfo}>
                        <Text style={[styles.reviewCardTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
                        <Text style={[styles.reviewCardSubtitle, { color: colors.textSecondary, fontSize: 11 }]}>
                          {mediaType === 'tv' ? 'Series' : 'Film'}
                        </Text>
                        <View style={styles.reviewStarsRow}>
                          {[...Array(5)].map((_, i) => (
                            <Text key={i} style={styles.reviewStar}>{i < review.rating ? '⭐' : '☆'}</Text>
                          ))}
                        </View>
                        {review.review_text && (
                          <Text style={[styles.reviewCardText, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={2}>{review.review_text}</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reviews yet</Text>
            )}
          </View>
        )}

        {/* Create List Modal */}
        <Modal
          visible={showCreateListModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateListModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create New List</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="List name"
                placeholderTextColor={colors.textSecondary}
                value={newListName}
                onChangeText={setNewListName}
              />
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newListDescription}
                onChangeText={setNewListDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowCreateListModal(false)}
                  disabled={creatingList}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary, opacity: newListName.trim() ? 1 : 0.6 }]}
                  onPress={async () => {
                    if (!newListName.trim() || creatingList) return;
                    try {
                      setCreatingList(true);
                      await playlistService.createPlaylist({
                        title: newListName.trim(),
                        description: newListDescription.trim(),
                      });
                      showToast('List created!', 'success');
                      setNewListName('');
                      setNewListDescription('');
                      setShowCreateListModal(false);
                      await loadProfileData();
                    } catch (error) {
                      console.error('Create list error:', error);
                      showToast('Failed to create list', 'error');
                    } finally {
                      setCreatingList(false);
                    }
                  }}
                  disabled={!newListName.trim() || creatingList}
                >
                  {creatingList ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.modalButtonTextDelete, { color: '#fff' }]}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {activeTab === 'profile' && (
          <>
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]} onPress={handleChangePassword}>
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]} onPress={handleHelpSupport}>
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.card }]} onPress={handleSignOut}>
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>TrackR v1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>© 2025 TrackR Trio. All rights reserved.</Text>
        </View>
          </>
        )}
      </CustomScrollView>

      {/* Sign Out Confirmation Modal (Web-friendly) */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>Are you sure you want to sign out?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={confirmSignOut}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 12,
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
  },
  avatar: {
    marginBottom: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  statsCard: {
    width: '50%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  gridItem: {
    marginRight: 16,
    marginLeft: 16,
    alignItems: 'center',
    width: 140,
    marginBottom: 16,
  },
  gridPoster: {
    width: 140,
    height: 210,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  watchlistHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 12,
  },
  watchlistTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  watchlistTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginLeft: 8,
    marginBottom: 8,
  },
  watchlistTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 10,
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginLeft: 16,
    alignItems: 'center',
  },
  watchedList: {
    paddingHorizontal: 8,
  },
  watchedItem: {
    marginHorizontal: 8,
    width: 140,
  },
  watchedPoster: {
    width: 140,
    height: 210,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  watchedTitle: {
    fontSize: 13,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  miniStar: {
    fontSize: 10,
    marginHorizontal: 1,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  playlistIcon: {
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  subTabScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
    marginBottom: 16,
  },
  subTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeSubTabChip: {
    borderColor: colors.primary,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  playlistDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createListButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1B1D',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonTextCancel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextDelete: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Review styles
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  reviewMoviePoster: {
    width: 50,
    height: 70,
    borderRadius: 4,
  },
  reviewCardInfo: {
    flex: 1,
  },
  reviewCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewStar: {
    fontSize: 12,
  },
  reviewCardText: {
    fontSize: 12,
    lineHeight: 16,
  },
};

export default ProfileScreen;