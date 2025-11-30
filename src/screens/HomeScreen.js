// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth'; // Add this import

const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newReleases, setNewReleases] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the auth hook instead of local state
  const { isLoggedIn, currentUser, signOut } = useAuth();

  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 80) / 9;
  const cardHeight = cardWidth * 1.4;

  useEffect(() => {
    loadHomeData();
  }, []);

  const checkAuthStatus = () => {
    // For demo purposes, let's simulate checking if user was previously logged in
    // In a real app, you would check AsyncStorage or your auth context
    const previouslyLoggedIn = false; // Change to true to test auto-login
    if (previouslyLoggedIn) {
      const user = { username: 'John' };
      setIsLoggedIn(true);
      setCurrentUser(user);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  };

  // TMDB API configuration
  const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

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
      
      console.log('Fetching data from TMDB API...');

      // Fetch popular movies
      const popularMoviesData = await fetchFromAPI('/movie/popular');
      console.log('Popular movies fetched:', popularMoviesData.results?.length);
      
      // Fetch popular TV series
      const popularTVData = await fetchFromAPI('/tv/popular');
      console.log('Popular TV fetched:', popularTVData.results?.length);
      
      // Fetch now playing movies (as new releases)
      const nowPlayingData = await fetchFromAPI('/movie/now_playing');
      console.log('Now playing movies fetched:', nowPlayingData.results?.length);
      
      // Fetch airing today TV shows
      const airingTodayData = await fetchFromAPI('/tv/airing_today');
      console.log('Airing today TV fetched:', airingTodayData.results?.length);

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

      console.log('Final new releases count:', combinedNewReleases.length);
      console.log('Final popular count:', combinedPopular.length);

      setNewReleases(combinedNewReleases);
      setPopular(combinedPopular);

    } catch (error) {
      console.error('Error loading home data:', error);
      setError('Failed to load content from TMDB API. Please check your internet connection.');
      // Fallback to empty arrays if API fails
      setNewReleases([]);
      setPopular([]);
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
      // Show profile options with logout
      Alert.alert(
        'Profile',
        `Welcome, ${currentUser?.username}!`,
        [
          { 
            text: 'View Profile', 
            onPress: () => navigation.navigate('Profile')
          },
          { 
            text: 'My Lists', 
            onPress: () => navigation.navigate('MyLists') 
          },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: () => {
              signOut();
              Alert.alert('Signed Out', 'You have been successfully signed out.');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.navigate('Sign In');
    }
  };

  const simulateSignIn = () => {
    const user = { username: 'John' };
    setIsLoggedIn(true);
    setCurrentUser(user);
    Alert.alert('Success', `Welcome back, ${user.username}!`);
  };

  const renderMovieCard = (item, index) => (
    <TouchableOpacity 
      key={item.id}
      style={[
        styles.movieCard,
        { 
          width: cardWidth,
          marginRight: (index + 1) % 9 === 0 ? 0 : 8, // 9 items per row
          marginBottom: 16, // Space between rows
        }
      ]}
      onPress={() => navigation.navigate('MovieDetail', { 
        movieId: item.id,
        mediaType: item.type === 'series' ? 'tv' : 'movie'
      })}
    >
      <View style={styles.movieImageContainer}>
        {item.poster ? (
          <Image 
            source={{ uri: item.poster }} 
            style={[styles.movieImage, { height: cardHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.movieImage, styles.movieImagePlaceholder, { height: cardHeight }]}>
            <Ionicons 
              name={item.type === 'movie' ? 'film' : 'tv'} 
              size={14} 
              color="#7B7C7D" 
            />
          </View>
        )}
        <View style={[
          styles.typeBadge,
          { backgroundColor: item.type === 'movie' ? '#00D084' : '#FF6B35' }
        ]}>
          <Text style={styles.typeText}>
            {item.type === 'movie' ? 'MOVIE' : 'SERIES'}
          </Text>
        </View>
      </View>
      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.movieYear}>{item.year}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={8} color="#FFC700" />
        <Text style={styles.rating}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading movies and series...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TrackR</Text>
        
        <View style={styles.rightContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies, series..."
              placeholderTextColor="#7B7C7D"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search" size={16} color="#7B7C7D" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={[styles.menuText, styles.activeMenuText]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Films')}>
              <Text style={styles.menuText}>Films</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Series')}>
              <Text style={styles.menuText}>Series</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
              <Text style={styles.menuText}>Playlist</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <View style={styles.profileContainer}>
              {isLoggedIn ? (
                <>
                  <Ionicons name="person-circle" size={20} color="#00D084" />
                  <Text style={styles.usernameText}>
                    {currentUser?.username}
                  </Text>
                </>
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content - ENSURED SCROLLABLE */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
          />
        }
      >
        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Welcome Message - Only show when logged in */}
        {isLoggedIn && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Welcome back, {currentUser?.username}! 👋
            </Text>
            <Text style={styles.welcomeSubtext}>
              Continue tracking your movies and series
            </Text>
          </View>
        )}

        {/* New on TrackR - 9 per line with proper spacing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New on TrackR</Text>
          {newReleases.length > 0 ? (
            <View style={styles.gridContainer}>
              {newReleases.map((item, index) => renderMovieCard(item, index))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No new releases found</Text>
          )}
        </View>

        {/* Popular on TrackR - 9 per line with proper spacing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular on TrackR</Text>
          {popular.length > 0 ? (
            <View style={styles.gridContainer}>
              {popular.map((item, index) => renderMovieCard(item, index))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No popular content found</Text>
          )}
        </View>

        {/* Extra space to ensure scrolling works */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141517',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingTop: 50,
    backgroundColor: '#1A1B1D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
  },
  logo: {
    marginLeft: 8,
    fontSize: 25,
    fontWeight: 'bold',
    color: '#00D084',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#F5F5F5',
  },
  activeMenuText: {
    color: '#00D084',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    maxWidth: 180,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#141517',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2B2D',
    paddingLeft: 36,
    color: '#F5F5F5',
    fontSize: 12,
  },
  searchButton: {
    position: 'absolute',
    left: 10,
    padding: 4,
  },
  profileButton: {
    marginLeft: 0,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D084',
    marginLeft: 4,
  },
  signInText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141517',
  },
  loadingText: {
    color: '#7B7C7D',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1B1D',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  errorText: {
    color: '#F5F5F5',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#1A1B1D',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D084',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#7B7C7D',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    color: '#F5F5F5',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  movieCard: {
    // Styles are applied inline for dynamic width and margins
  },
  movieImageContainer: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  movieImage: {
    width: '100%',
    borderRadius: 6,
  },
  movieImagePlaceholder: {
    backgroundColor: '#1A1B1D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2D',
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 15,
  },
  movieYear: {
    fontSize: 12,
    color: '#7B7C7D',
    marginBottom: 3,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rating: {
    marginLeft: 2,
    fontSize: 12,
    color: '#FFC700',
    fontWeight: '600',
  },
  emptyText: {
    color: '#7B7C7D',
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;