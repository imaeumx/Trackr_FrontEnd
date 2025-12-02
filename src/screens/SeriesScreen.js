// src/screens/SeriesScreen.js - UPDATED
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
import CustomScrollView from '../components/CustomScrollView';
import { movieService } from '../services/movieService';
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';

const SeriesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredSeries, setFeaturedSeries] = useState([]); // Add this
  const [newSeries, setNewSeries] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { isLoggedIn, currentUser, signOut } = useAuth();

  useEffect(() => {
    loadSeriesData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSeriesData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = allSeries.filter(series =>
        series.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSeries(filtered);
    } else {
      setFilteredSeries(allSeries);
    }
  }, [searchQuery, allSeries]);

  const loadSeriesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get trending series for featured carousel
      const trendingData = await movieService.getPopularMovies('tv', 1);
      const featuredTV = trendingData.results?.slice(0, 6).map(item => ({
        id: item.id,
        title: item.name,
        description: item.overview?.substring(0, 100) + '...' || 'Featured series',
        image: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : 
               item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : null,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'
      })) || [];

      setFeaturedSeries(featuredTV);

      // Load popular series from TMDB
      const popularData = await movieService.getPopularMovies('tv', 1);
      const popularTV = popularData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview
      })) || [];

      // Load new series (using page 2 for variety)
      const newSeriesData = await movieService.getPopularMovies('tv', 2);
      const newTV = newSeriesData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.name,
        type: 'series',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview
      })) || [];

      setPopularSeries(popularTV);
      setNewSeries(newTV);
      
      // Combine for "All Series"
      const combinedSeries = [...popularTV, ...newTV];
      const uniqueSeries = combinedSeries.filter((series, index, self) =>
        index === self.findIndex(s => s.title === series.title)
      );
      setAllSeries(uniqueSeries);
      setFilteredSeries(uniqueSeries);

    } catch (error) {
      console.error('Error loading series data:', error);
      setError('Failed to load series. Please check your connection.');
      
      // Fallback sample featured series
      const sampleFeatured = [
        {
          id: 1,
          title: 'Stranger Things',
          description: 'When a young boy vanishes, a small town uncovers a mystery...',
          image: 'https://image.tmdb.org/t/p/w1280/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg',
          type: 'series',
          rating: '4.5',
          year: 2016
        },
        {
          id: 2,
          title: 'The Crown',
          description: 'Follows the political rivalries and romance of Queen Elizabeth...',
          image: 'https://image.tmdb.org/t/p/w1280/1M876KPjulVwppEpLDd8fgWnOXY.jpg',
          type: 'series',
          rating: '4.3',
          year: 2016
        },
        {
          id: 3,
          title: 'Breaking Bad',
          description: 'A high school chemistry teacher diagnosed with cancer...',
          image: 'https://image.tmdb.org/t/p/w1280/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          type: 'series',
          rating: '4.8',
          year: 2008
        }
      ];
      
      setFeaturedSeries(sampleFeatured);
      
      // Fallback sample data
      const sampleSeries = [
        {
          id: 1,
          title: 'Stranger Things',
          type: 'series',
          rating: '4.5',
          year: 2016,
          poster: 'https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg',
          description: 'When a young boy vanishes...'
        },
        {
          id: 2,
          title: 'The Crown',
          type: 'series',
          rating: '4.3',
          year: 2016,
          poster: 'https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpLDd8fgWnOXY.jpg',
          description: 'Follows the political rivalries...'
        },
        {
          id: 3,
          title: 'Breaking Bad',
          type: 'series',
          rating: '4.8',
          year: 2008,
          poster: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
          description: 'A high school chemistry teacher...'
        }
      ];
      
      setPopularSeries(sampleSeries);
      setNewSeries(sampleSeries.slice().reverse());
      setAllSeries(sampleSeries);
      setFilteredSeries(sampleSeries);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSeriesData();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const searchData = await movieService.searchMovies(searchQuery);
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

  const handleSeriesPress = (item) => {
    navigation.navigate('MovieDetail', { 
      movieId: item.id,
      mediaType: 'tv'
    });
  };

  const handleFeaturedPress = (item) => {
    navigation.navigate('MovieDetail', {
      movieId: item.id,
      mediaType: 'tv'
    });
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading series...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Header
        navigation={navigation}
        activeScreen="Series"
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
              Continue tracking your series
            </Text>
          </View>
        )}

        {/* Featured Series Carousel */}
        <FeaturedCarousel
          title="Featured Series"
          items={featuredSeries}
          onItemPress={handleFeaturedPress}
          autoPlay={true}
        />

        {searchQuery ? (
          // Search Results in Grid
          <GridSection
            title={`Search Results for "${searchQuery}" (${filteredSeries.length})`}
            data={filteredSeries}
            onItemPress={handleSeriesPress}
          />
        ) : (
          // Regular Series Sections
          <>
            {/* New Series on TrackR */}
            <GridSection
              title="New Series on TrackR"
              data={newSeries}
              onItemPress={handleSeriesPress}
            />

            {/* Popular Series on TrackR */}
            <GridSection
              title="Popular Series on TrackR"
              data={popularSeries}
              onItemPress={handleSeriesPress}
            />

            {/* All Series */}
            <GridSection
              title={`All Series (${allSeries.length})`}
              data={allSeries}
              onItemPress={handleSeriesPress}
            />
          </>
        )}

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>
    </View>
  );
};

export default SeriesScreen;