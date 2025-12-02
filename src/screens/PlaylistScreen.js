// src/screens/PlaylistScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FeaturedCarousel from '../components/FeaturedCarousel'; // Add this import
import CustomScrollView from '../components/CustomScrollView';
import { playlistService } from '../services/playlistService';
import { authService } from '../services/auth';
import { globalStyles, colors } from '../styles/globalStyles';

const PlaylistScreen = ({ navigation }) => {
  const [playlists, setPlaylists] = useState([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]); // Add this
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadPlaylists();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleRefresh = async () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    await loadPlaylists();
    setRefreshing(false);
  };

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.validateToken();
      const user = authService.getCurrentUser();

      setIsLoggedIn(authenticated);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadPlaylists = async () => {
    if (!isLoggedIn) return;

    try {
      setLoading(true);
      setError(null);

      // Try to fetch real trending data for featured section (TMDB)
      const TMDB_API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
      let featuredData = [];
      try {
        const trendingResponse = await fetch(
          `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}`
        );
        const trendingJson = await trendingResponse.json();
        featuredData = (trendingJson.results || []).slice(0, 4).map((item, idx) => ({
          id: `featured-${idx + 1}`,
          title: item.title || item.name || `Featured ${idx + 1}`,
          description: (item.overview && item.overview.length > 0) ? (item.overview.substring(0, 120) + '...') : 'Featured content',
          image: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : ''),
          type: item.media_type === 'tv' ? 'series' : 'movie',
          count: Math.floor(Math.random() * 30) + 10
        }));
      } catch (err) {
        console.warn('Failed to fetch TMDB trending for featured playlists, using fallback data.', err);
      }

      if (!featuredData || featuredData.length === 0) {
        featuredData = [
          {
            id: 'featured-1',
            title: 'Trending Now',
            description: 'Most popular movies and series this week',
            image: 'https://image.tmdb.org/t/p/w1280/jD98aUKHQZNAmrk0wQQ9wH8dYGC.jpg',
            type: 'playlist',
            count: 25
          },
          {
            id: 'featured-2',
            title: 'Classic Collection',
            description: 'Timeless movies everyone should watch',
            image: 'https://image.tmdb.org/t/p/w1280/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
            type: 'playlist',
            count: 20
          },
          {
            id: 'featured-3',
            title: 'Hidden Gems',
            description: 'Underrated movies you might have missed',
            image: 'https://image.tmdb.org/t/p/w1280/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
            type: 'playlist',
            count: 15
          },
          {
            id: 'featured-4',
            title: 'Award Winners',
            description: 'Oscar-winning films and series',
            image: 'https://image.tmdb.org/t/p/w1280/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
            type: 'playlist',
            count: 30
          }
        ];
      }

      setFeaturedPlaylists(featuredData);

      // Load playlists from API
      const playlistsData = await playlistService.getPlaylists();
      setPlaylists(playlistsData.results || []);

    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Failed to load playlists. Please check your connection.');
      setPlaylists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    loadPlaylists();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to search playlists.');
      return;
    }

    Alert.alert('Search', `Searching for: ${searchQuery}`);
  };

  const handleProfilePress = () => {
    if (isLoggedIn) {
      // Navigate directly to Profile screen - NO ALERT
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Sign In');
    }
  };

  const handleCreatePlaylist = () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to create playlists.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert('Create Playlist', 'Create new playlist functionality');
  };

  const handlePlaylistPress = (playlist) => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view playlists.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert(playlist.title, `Viewing playlist: ${playlist.title}`);
  };

  const handleFeaturedPress = (item) => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view featured playlists.');
      navigation.navigate('Sign In');
      return;
    }

    // Navigate to a detail screen when a featured item is pressed
    if (item.type === 'movie' || item.type === 'series') {
      navigation.navigate('MovieDetail', {
        movieId: item.id,
        mediaType: item.type === 'series' ? 'tv' : 'movie'
      });
    } else {
      // For playlist-style featured items, open the user's lists screen
      navigation.navigate('MyLists');
    }
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity
      style={styles.playlistCard}
      onPress={() => handlePlaylistPress(item)}
    >
      <View style={styles.playlistIcon}>
        <Ionicons name="list" size={24} color={colors.primary} />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle}>{item.title}</Text>
        <Text style={styles.playlistDescription}>
          {item.description || 'No description'}
        </Text>
        <Text style={styles.playlistStats}>
          {item.item_count || 0} items
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderCreatePlaylistCard = () => (
    <TouchableOpacity
      style={styles.createPlaylistCard}
      onPress={handleCreatePlaylist}
    >
      <View style={styles.createPlaylistIcon}>
        <Ionicons name="add-circle" size={32} color={colors.primary} />
      </View>
      <Text style={styles.createPlaylistText}>Create New Playlist</Text>
    </TouchableOpacity>
  );

  const renderSignInPrompt = () => (
    <View style={styles.signInContainer}>
      <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
      <Text style={styles.signInTitle}>Sign In Required</Text>
      <Text style={styles.signInText}>
        Please sign in to access your playlists and create new ones.
      </Text>
      <TouchableOpacity
        style={styles.signInButton}
        onPress={() => navigation.navigate('Sign In')}
      >
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.guestButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.guestButtonText}>Continue Browsing</Text>
      </TouchableOpacity>
    </View>
  );

  if (!authChecked || loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Header
        navigation={navigation}
        activeScreen="Playlist"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onProfilePress={handleProfilePress}
        searchPlaceholder={isLoggedIn ? "Search playlists..." : "Sign in to search..."}
        searchEditable={isLoggedIn}
      />

      <CustomScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={[globalStyles.scrollContent, { minHeight: Dimensions.get('window').height - 120 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {!isLoggedIn ? (
          // Show sign in prompt for non-authenticated users
          renderSignInPrompt()
        ) : (
          // Show playlists for authenticated users
          <>
            {/* Error Message */}
            {error && (
              <View style={globalStyles.errorContainer}>
                <Text style={globalStyles.errorText}>{error}</Text>
              </View>
            )}

            {/* Welcome Message */}
            <View style={globalStyles.welcomeContainer}>
              <Text style={globalStyles.welcomeText}>
                Welcome back, {currentUser?.username}! 👋
              </Text>
              <Text style={globalStyles.welcomeSubtext}>
                Manage your movie and series playlists
              </Text>
            </View>

            {/* Featured Playlists Carousel */}
            <FeaturedCarousel
              title="Featured Collections"
              items={featuredPlaylists}
              onItemPress={handleFeaturedPress}
              autoPlay={true}
            />
            {/* Create Playlist Card */}
            {renderCreatePlaylistCard()}

            {/* Playlists List */}
            <View style={globalStyles.section}>
              <Text style={globalStyles.sectionTitle}>Your Playlists ({playlists.length})</Text>
              {playlists.length > 0 ? (
                <FlatList
                  data={playlists}
                  renderItem={renderPlaylistItem}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="list" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No playlists yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create your first playlist to organize your movies and series
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>
    </View>
  );
};

// Playlist-specific styles
const styles = {
  playlistCard: {
    backgroundColor: colors.card,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
    color: colors.text,
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  playlistStats: {
    fontSize: 12,
    color: colors.primary,
  },
  createPlaylistCard: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  createPlaylistIcon: {
    marginBottom: 8,
  },
  createPlaylistText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  signInText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
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
};

export default PlaylistScreen;