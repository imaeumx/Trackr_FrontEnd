// src/screens/HomeScreen.js - UPDATED
import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  Dimensions
} from 'react-native';
import Header from '../components/Header';
import GridSection from '../components/GridSection';
import FeaturedCarousel from '../components/FeaturedCarousel'; // Add this import
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';

// TMDB API configuration
const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newReleases, setNewReleases] = useState([]);
  const [popular, setPopular] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]); // Add this state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { isLoggedIn, currentUser, signOut } = useAuth();

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const fetchFromAPI = async (endpoint) => {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}`);
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

      // Fetch trending for featured carousel
      const trendingData = await fetchFromAPI('/trending/all/week');

      // Process featured items for carousel
      const trendingItems = trendingData.results?.slice(0, 6).map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.overview?.substring(0, 100) + '...' || 'No description available',
        image: item.backdrop_path ? `${IMAGE_BASE_URL}${item.backdrop_path}` : 
               item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null,
        type: item.media_type || 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'
      })) || [];

      setFeaturedItems(trendingItems);

      // Process new releases - mix of movies and TV
      const newMovies = nowPlayingData.results?.slice(0, 18).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const newTV = airingTodayData.results?.slice(0, 18).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      // Process popular - mix of movies and TV
      const popularMovies = popularMoviesData.results?.slice(0, 18).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : null
      })) || [];

      const popularTV = popularTVData.results?.slice(0, 18).map(item => ({
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

      setNewReleases(combinedNewReleases);
      setPopular(combinedPopular);

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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const searchData = await fetchFromAPI(`/search/multi?query=${encodeURIComponent(searchQuery)}`);
      navigation.navigate('SearchResults', { 
        results: searchData.results || [],
        query: searchQuery 
      });
    } catch (error) {
      Alert.alert('Search Error', 'Failed to search. Please check your connection.');
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
      />

      <CustomScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={[globalStyles.scrollContent, { minHeight: Dimensions.get('window').height - 120 }]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {/* Error Message */}
        {error && (
          <View style={globalStyles.errorContainer}>
            <Text style={globalStyles.errorText}>{error}</Text>
          </View>
        )}

        {/* Welcome Message - Only show when logged in */}
        {isLoggedIn && (
          <View style={globalStyles.welcomeContainer}>
            <Text style={globalStyles.welcomeText}>
              Welcome back, {currentUser?.username}! 👋
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
          isLoggedIn={isLoggedIn}
        />

        {/* Popular on TrackR */}
        <GridSection
          title="Popular on TrackR"
          data={popular}
          onItemPress={handleItemPress}
          isLoggedIn={isLoggedIn}
        />

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>
    </View>
  );
};

export default HomeScreen;