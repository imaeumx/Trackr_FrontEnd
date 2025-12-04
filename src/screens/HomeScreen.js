// src/screens/HomeScreen.js - UPDATED
import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  Dimensions,
  Modal,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import GridSection from '../components/GridSection';
import FeaturedCarousel from '../components/FeaturedCarousel'; // Add this import
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';
import { movieService } from '../services/movieService';
import { playlistService } from '../services/playlistService';
import { shuffleArray } from '../utils/shuffle';

// TMDB API configuration
const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newReleases, setNewReleases] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [anime, setAnime] = useState([]);
  const [kdrama, setKdrama] = useState([]);
  const [action, setAction] = useState([]);
  const [comedy, setComedy] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]); // Add this state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = React.useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = React.useRef(null);
  
  const { isLoggedIn, currentUser, signOut } = useAuth();

  useEffect(() => {
    loadHomeData();
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery.trim())}`
          );
          if (response.ok) {
            const data = await response.json();
            const filtered = data.results?.filter(item => 
              (item.media_type === 'movie' || item.media_type === 'tv') &&
              (item.poster_path || item.title || item.name)
            ) || [];
            setSearchResults(filtered);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Hide welcome message after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const fetchFromAPI = async (endpoint) => {
    try {
      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await fetch(`${BASE_URL}${endpoint}${separator}api_key=${API_KEY}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const loadHomeData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch popular movies
      const popularMoviesData = await fetchFromAPI('/movie/popular');
      
      // Fetch popular TV series
      const popularTVData = await fetchFromAPI('/tv/popular');
      
      // Fetch now playing movies (as new releases)
      const nowPlayingData = await fetchFromAPI('/movie/now_playing');
      
      // Fetch airing today TV shows
      const airingTodayData = await fetchFromAPI('/tv/airing_today');

      // Fetch top rated movies
      const topRatedMoviesData = await fetchFromAPI('/movie/top_rated');
      
      // Fetch top rated TV series
      const topRatedTVData = await fetchFromAPI('/tv/top_rated');

      // Fetch trending for featured carousel (most viewed)
      const trendingData = await fetchFromAPI('/trending/all/week');
      
      // Fetch trending movies (most viewed)
      const trendingMoviesData = await fetchFromAPI('/trending/movie/week');
      
      // Fetch trending TV (most viewed)
      const trendingTVData = await fetchFromAPI('/trending/tv/week');

      // Fetch TV Shows specifically
      const tvShowsData = await fetchFromAPI('/tv/top_rated');

      // Fetch Anime (using genre ID 16 for anime)
      const animeData = await fetchFromAPI('/discover/tv?with_genres=16&sort_by=popularity.desc');

      // Fetch K-Drama (Korean, Drama genre)
      const kdramaData = await fetchFromAPI('/discover/tv?with_origin_country=KR&sort_by=popularity.desc');

      // Fetch Action movies (genre ID 28)
      const actionData = await fetchFromAPI('/discover/movie?with_genres=28&sort_by=popularity.desc');

      // Fetch Comedy movies (genre ID 35)
      const comedyData = await fetchFromAPI('/discover/movie?with_genres=35&sort_by=popularity.desc');

      // Process featured items for carousel
      const trendingItems = trendingData.results?.slice(0, 6).map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.overview?.substring(0, 100) + '...' || 'No description available',
        image: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 
               item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null,
        type: item.media_type || 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'
      })) || [];

      setFeaturedItems(trendingItems);

      // Process new releases - mix of movies and TV
      const newMovies = nowPlayingData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const newTV = airingTodayData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process popular - mix of movies and TV
      const popularMovies = popularMoviesData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const popularTV = popularTVData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Combine arrays
      const combinedNewReleases = [...newMovies, ...newTV].slice(0, 36);
      const combinedPopular = [...popularMovies, ...popularTV].slice(0, 36);

      // Process top rated - mix of movies and TV
      const topRatedMovies = topRatedMoviesData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const topRatedTV = topRatedTVData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const combinedTopRated = [...topRatedMovies, ...topRatedTV].slice(0, 36);

      // Process most viewed (trending) - mix of movies and TV
      const mostViewedMovies = trendingMoviesData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const mostViewedTV = trendingTVData.results?.slice(0, 54).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const combinedMostViewed = [...mostViewedMovies, ...mostViewedTV].slice(0, 36);

      // Process TV Shows
      const tvShowsProcessed = tvShowsData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process Anime
      const animeProcessed = animeData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process K-Drama
      const kdramaProcessed = kdramaData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process Action
      const actionProcessed = actionData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process Comedy
      const comedyProcessed = comedyData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Shuffle all arrays for variety on each reload
      setNewReleases(shuffleArray(combinedNewReleases));
      setPopular(shuffleArray(combinedPopular));
      setTopRated(shuffleArray(combinedTopRated));
      setMostViewed(shuffleArray(combinedMostViewed));
      setTvShows(shuffleArray(tvShowsProcessed));
      setAnime(shuffleArray(animeProcessed));
      setKdrama(shuffleArray(kdramaProcessed));
      setAction(shuffleArray(actionProcessed));
      setComedy(shuffleArray(comedyProcessed));

    } catch (error) {
      console.error('Error loading home data:', error);
      setError('Failed to load content from TMDB API. Please check your internet connection.');
      
      // Fallback sample featured items
      const sampleFeatured = [
        {
          id: 1,
          title: 'The Shawshank Redemption',
          description: 'Two imprisoned men bond over a number of years...',
          image: 'https://image.tmdb.org/t/p/w1280/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          type: 'movie',
          rating: '4.8',
          year: 1994
        },
        {
          id: 2,
          title: 'Stranger Things',
          description: 'When a young boy vanishes, a small town uncovers a mystery...',
          image: 'https://image.tmdb.org/t/p/w1280/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg',
          type: 'series',
          rating: '4.5',
          year: 2016
        },
        {
          id: 3,
          title: 'The Godfather',
          description: 'The aging patriarch of an organized crime dynasty...',
          image: 'https://image.tmdb.org/t/p/w1280/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          type: 'movie',
          rating: '4.7',
          year: 1972
        }
      ];
      
      setFeaturedItems(sampleFeatured);
      
      // Fallback sample data for grid sections
      const sampleData = [
        {
          id: 1,
          title: 'The Shawshank Redemption',
          type: 'movie',
          rating: '4.8',
          year: 1994,
          poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
        },
        {
          id: 2,
          title: 'The Godfather',
          type: 'movie',
          rating: '4.7',
          year: 1972,
          poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg'
        },
        {
          id: 3,
          title: 'Stranger Things',
          type: 'series',
          rating: '4.5',
          year: 2016,
          poster: 'https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg'
        }
      ];
      
      setNewReleases(sampleData);
      setPopular(sampleData);
      setTopRated(sampleData);
      setMostViewed(sampleData);
      setTvShows(sampleData);
      setAnime(sampleData);
      setKdrama(sampleData);
      setAction(sampleData);
      setComedy(sampleData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleSearchResultPress = (item) => {
    setSearchQuery('');
    setSearchResults([]);
    navigation.navigate('MovieDetail', {
      movie: {
        id: item.id,
        title: item.title || item.name,
        type: item.media_type === 'movie' ? 'movie' : 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : 'N/A',
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        description: item.overview,
      },
    });
  };

  const handleSearch = () => {
    // Navigate to SearchResults page when Enter is pressed
    if (searchResults.length > 0) {
      navigation.navigate('SearchResults', {
        results: searchResults,
        query: searchQuery
      });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleProfilePress = () => {
    if (isLoggedIn) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('Sign In');
    }
  };

  const handleItemPress = (item) => {
    console.log('Item pressed:', item);
    
    navigation.navigate('MovieDetail', { 
      movieId: item.tmdbId || item.id,
      mediaType: item.mediaType || (item.type === 'series' ? 'tv' : 'movie'),
      movie: {
        id: item.tmdbId || item.id,
        title: item.title,
        type: item.type || item.media_type || 'movie',
        rating: item.rating,
        year: item.year || item.release_year,
        poster: item.poster || item.poster_url
      }
    });
  };

  const handleFeaturedPress = (item) => {
    console.log('Featured item pressed:', item);
    
    navigation.navigate('MovieDetail', {
      movieId: item.tmdbId || item.id,
      mediaType: item.mediaType || (item.type === 'series' ? 'tv' : 'movie'),
      movie: {
        id: item.tmdbId || item.id,
        title: item.title,
        type: item.type || item.media_type || 'movie',
        rating: item.rating,
        year: item.year || item.release_year,
        poster: item.poster || item.poster_url
      }
    });
  };

  const handleAddToList = async (item) => {
    console.log('Add to list clicked:', item);
    
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your playlists.');
      navigation.navigate('Sign In');
      return;
    }

    // Store selected movie
    setSelectedMovie(item);
    
    // Load playlists
    try {
      setLoadingPlaylists(true);
      const userPlaylists = await playlistService.getPlaylists();
      setPlaylists(Array.isArray(userPlaylists) ? userPlaylists : (userPlaylists.results || []));
      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Error loading playlists:', error);
      Alert.alert('Error', 'Failed to load playlists. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleSelectPlaylist = async (playlistId) => {
    if (!selectedMovie) return;

    try {
      setShowPlaylistModal(false);
      
      const tmdbId = selectedMovie.tmdbId || selectedMovie.id;
      const mediaType = selectedMovie.mediaType || (selectedMovie.type === 'series' ? 'tv' : 'movie');

      // Create movie in backend
      const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
      
      // Add to playlist
      await playlistService.addMovieToPlaylist(playlistId, createdMovie.id, 'to_watch');
      Alert.alert('Success', 'Movie added to your playlist!');
    } catch (error) {
      console.error('Error adding to playlist:', error);
      if (error.error === 'Movie already in playlist') {
        Alert.alert('Already Added', 'This movie is already in that playlist.');
      } else {
        Alert.alert('Error', error.formattedMessage || 'Failed to add movie to playlist.');
      }
    }
  };

  // Create new playlist from modal and add selected movie into it
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

      // Add the movie to the new playlist if we have a selected movie
      if (selectedMovie) {
        const tmdbId = selectedMovie.tmdbId || selectedMovie.id;
        const mediaType = selectedMovie.mediaType || (selectedMovie.type === 'series' ? 'tv' : 'movie');

        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        await playlistService.addMovieToPlaylist(newPlaylist.id, createdMovie.id, 'to_watch');
      }

      Alert.alert('Success', `Created playlist "${newPlaylistName}" and added movie!`);

      // Reset states
      setShowCreatePlaylistInput(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowPlaylistModal(false);
      setSelectedMovie(null);
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading movies and series...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Header
        navigation={navigation}
        activeScreen="Home"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onProfilePress={handleProfilePress}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearchResultPress={handleSearchResultPress}
        onClearSearch={() => {
          setSearchQuery('');
          setSearchResults([]);
        }}
      />

      <CustomScrollView
        ref={scrollViewRef}
        style={globalStyles.scrollView}
        contentContainerStyle={[globalStyles.scrollContent, { minHeight: Dimensions.get('window').height - 120 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setShowScrollToTop(offsetY > 300);
          // Clear search when scrolling
          if (searchQuery.trim()) {
            setSearchQuery('');
            setSearchResults([]);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Error Message */}
        {error && (
          <View style={globalStyles.errorContainer}>
            <Text style={globalStyles.errorText}>{error}</Text>
          </View>
        )}

        {/* Welcome Message - Only show when logged in and showWelcome is true */}
        {isLoggedIn && showWelcome && (
          <View style={globalStyles.welcomeContainer}>
            <Text style={globalStyles.welcomeText}>
              Welcome back, {currentUser?.username}!
            </Text>
            <Text style={globalStyles.welcomeSubtext}>
              Continue tracking your movies and series
            </Text>
          </View>
        )}

        {/* Featured Carousel */}
        <FeaturedCarousel
          title="Featured This Week"
          items={featuredItems}
          onItemPress={handleFeaturedPress}
          autoPlay={true}
          showIndicators={true}
        />

        {/* New on TrackR */}
        <GridSection
          title="New on TrackR"
          data={newReleases}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Popular on TrackR */}
        <GridSection
          title="Popular on TrackR"
          data={popular}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Top Rated */}
        <GridSection
          title="Top Rated on TrackR"
          data={topRated}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Most Viewed */}
        <GridSection
          title="Most Viewed on TrackR"
          data={mostViewed}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* TV Shows */}
        <GridSection
          title="Popular TV Shows"
          data={tvShows}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Anime */}
        <GridSection
          title="Anime Series"
          data={anime}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* K-Drama */}
        <GridSection
          title="K-Drama"
          data={kdrama}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Action */}
        <GridSection
          title="Action Movies"
          data={action}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Comedy */}
        <GridSection
          title="Comedy Movies"
          data={comedy}
          onItemPress={handleItemPress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Ionicons name="chevron-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}

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
            
            {/* Create New Playlist Section */}
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
    </View>
  );
};

const styles = {
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
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
    paddingVertical: 16,
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
    marginVertical: 20,
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
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
};

export default HomeScreen;