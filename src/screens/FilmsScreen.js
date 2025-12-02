// src/screens/FilmsScreen.js - UPDATED
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

const FilmsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFilms, setFeaturedFilms] = useState([]); // Add this
  const [newFilms, setNewFilms] = useState([]);
  const [popularFilms, setPopularFilms] = useState([]);
  const [topRatedFilms, setTopRatedFilms] = useState([]);
  const [mostViewedFilms, setMostViewedFilms] = useState([]);
  const [allFilms, setAllFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const { isLoggedIn, currentUser, signOut } = useAuth();

  useEffect(() => {
    loadFilmsData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFilmsData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (searchQuery) {
      const filtered = allFilms.filter(film =>
        film.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFilms(filtered);
    } else {
      setFilteredFilms(allFilms);
    }
  }, [searchQuery, allFilms]);

  const loadFilmsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get trending movies for featured carousel
      const trendingData = await movieService.getPopularMovies('movie', 1);
      const featuredMovies = trendingData.results?.slice(0, 6).map(item => ({
        id: item.id,
        title: item.title || item.name,
        description: item.overview?.substring(0, 100) + '...' || 'Featured movie',
        image: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : 
               item.poster_path ? `https://image.tmdb.org/t/p/w1280${item.poster_path}` : null,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'
      })) || [];

      setFeaturedFilms(featuredMovies);

      // Get popular movies (page 1)
      const popularData = await movieService.getPopularMovies('movie', 1);
      const popularMovies = popularData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title || item.name,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview,
        vote_average: item.vote_average
      })) || [];

      // Get new movies (page 2 of popular)
      const newData = await movieService.getPopularMovies('movie', 2);
      const newMovies = newData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title || item.name,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview,
        vote_average: item.vote_average
      })) || [];

      // For top rated, sort popular movies by rating
      const topRated = [...popularMovies]
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 36);

      // For most viewed, use page 3 of popular movies
      const mostViewedData = await movieService.getPopularMovies('movie', 3);
      const mostViewed = mostViewedData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title || item.name,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 
              item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview
      })) || [];

      // Get local movies
      const localMoviesData = await movieService.getLocalMovies();
      const localMovies = localMoviesData.results?.map(movie => ({
        id: movie.id,
        title: movie.title,
        type: movie.media_type || 'movie',
        rating: 4.0,
        year: movie.release_year,
        poster: movie.poster_url,
        description: movie.description,
        isLocal: true
      })) || [];

      setPopularFilms(popularMovies);
      setNewFilms(newMovies);
      setTopRatedFilms(topRated);
      setMostViewedFilms(mostViewed);
      
      // Combine all movies
      const combinedFilms = [...popularMovies, ...newMovies, ...topRated, ...mostViewed, ...localMovies];
      // Remove duplicates based on id
      const uniqueFilms = combinedFilms.filter((film, index, self) =>
        index === self.findIndex(f => f.id === film.id)
      );
      setAllFilms(uniqueFilms);
      setFilteredFilms(uniqueFilms);

    } catch (error) {
      console.error('Error loading films data:', error);
      setError('Failed to load films. Showing sample data.');
      
      // Fallback sample featured films
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
          title: 'The Godfather',
          description: 'The aging patriarch of an organized crime dynasty...',
          image: 'https://image.tmdb.org/t/p/w1280/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          type: 'movie',
          rating: '4.7',
          year: 1972
        },
        {
          id: 3,
          title: 'The Dark Knight',
          description: 'Batman faces the Joker in this epic superhero film...',
          image: 'https://image.tmdb.org/t/p/w1280/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
          type: 'movie',
          rating: '4.8',
          year: 2008
        }
      ];
      
      setFeaturedFilms(sampleFeatured);
      
      // Fallback sample data
      const sampleMovies = [
        {
          id: 1,
          title: 'The Shawshank Redemption',
          type: 'movie',
          rating: '4.8',
          year: 1994,
          poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
          description: 'Two imprisoned men bond over a number of years...'
        },
        {
          id: 2,
          title: 'The Godfather',
          type: 'movie',
          rating: '4.7',
          year: 1972,
          poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
          description: 'The aging patriarch of an organized crime dynasty...'
        },
        // ... rest of your sample data
      ];

      setPopularFilms(sampleMovies);
      setNewFilms(sampleMovies.slice().reverse());
      setTopRatedFilms([...sampleMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)));
      setMostViewedFilms(sampleMovies.slice(0, 6));
      setAllFilms(sampleMovies);
      setFilteredFilms(sampleMovies);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFilmsData();
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

  const handleMoviePress = (item) => {
    navigation.navigate('MovieDetail', { 
      movieId: item.id,
      mediaType: 'movie'
    });
  };

  const handleFeaturedPress = (item) => {
    navigation.navigate('MovieDetail', {
      movieId: item.id,
      mediaType: 'movie'
    });
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading films...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <Header
        navigation={navigation}
        activeScreen="Films"
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
              Continue tracking your films
            </Text>
          </View>
        )}

        {/* Featured Films Carousel */}
        <FeaturedCarousel
          title="Featured Films"
          items={featuredFilms}
          onItemPress={handleFeaturedPress}
          autoPlay={true}
        />

        {searchQuery ? (
          // Search Results in Grid
          <GridSection
            title={`Search Results for "${searchQuery}" (${filteredFilms.length})`}
            data={filteredFilms}
            onItemPress={handleMoviePress}
            showLocalBadge={true}
          />
        ) : (
          // Regular Film Sections in Grid
          <>
            {/* New Films on TrackR */}
            <GridSection
              title="New Films on TrackR"
              data={newFilms}
              onItemPress={handleMoviePress}
            />

            {/* Popular Films on TrackR */}
            <GridSection
              title="Popular Films on TrackR"
              data={popularFilms}
              onItemPress={handleMoviePress}
            />

            {/* Top Rated Movies */}
            <GridSection
              title="Top Rated Movies"
              data={topRatedFilms}
              onItemPress={handleMoviePress}
            />

            {/* Most Viewed Movies */}
            <GridSection
              title="Most Viewed Movies"
              data={mostViewedFilms}
              onItemPress={handleMoviePress}
            />

            {/* All Films */}
            <GridSection
              title={`All Films (${allFilms.length})`}
              data={allFilms}
              onItemPress={handleMoviePress}
              showLocalBadge={true}
            />
          </>
        )}

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>
    </View>
  );
};

export default FilmsScreen;