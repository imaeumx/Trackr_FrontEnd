// src/screens/FilmsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { movieService } from '../services/movieService';
import { useAuth } from '../hooks/useAuth'; // Add this import

const FilmsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newFilms, setNewFilms] = useState([]);
  const [popularFilms, setPopularFilms] = useState([]);
  const [allFilms, setAllFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the auth hook
  const { isLoggedIn, currentUser, signOut } = useAuth();

  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 80) / 9;
  const cardHeight = cardWidth * 1.4;

  useEffect(() => {
    loadFilmsData();
  }, []);

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

  const checkAuthStatus = () => {
    // For demo purposes, let's simulate checking if user was previously logged in
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

  const loadFilmsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load popular films from TMDB
      const popularData = await movieService.getPopularMovies('movie', 1);
      const popularMovies = popularData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview
      })) || [];

      // Since we don't have now-playing endpoint, let's use page 2 of popular movies for variety
      const newFilmsData = await movieService.getPopularMovies('movie', 2);
      const newMovies = newFilmsData.results?.slice(0, 36).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview
      })) || [];

      // Load all local movies from your database
      const localMovies = await movieService.getLocalMovies();
      const allLocalMovies = localMovies.results?.map(movie => ({
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
      
      // Combine TMDB and local movies for "All Films"
      const combinedFilms = [...popularMovies, ...newMovies, ...allLocalMovies];
      // Remove duplicates based on title
      const uniqueFilms = combinedFilms.filter((film, index, self) =>
        index === self.findIndex(f => f.title === film.title)
      );
      setAllFilms(uniqueFilms);
      setFilteredFilms(uniqueFilms);

    } catch (error) {
      console.error('Error loading films data:', error);
      setError('Failed to load films. Please check your connection.');
      // Set empty arrays to avoid crashes
      setPopularFilms([]);
      setNewFilms([]);
      setAllFilms([]);
      setFilteredFilms([]);
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

  // Render movie card in grid layout
  const renderMovieCard = (item, index) => (
    <TouchableOpacity 
      key={item.id}
      style={[
        styles.movieCard,
        { 
          width: cardWidth,
          marginRight: (index + 1) % 9 === 0 ? 0 : 8,
          marginBottom: 16,
        }
      ]}
      onPress={() => navigation.navigate('MovieDetail', { 
        movieId: item.id,
        mediaType: 'movie'
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
            <Ionicons name="film" size={14} color="#7B7C7D" />
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>MOVIE</Text>
        </View>
        {item.isLocal && (
          <View style={styles.localBadge}>
            <Text style={styles.localBadgeText}>Local</Text>
          </View>
        )}
      </View>
      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.movieYear}>{item.year}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={8} color="#FFC700" />
        <Text style={styles.rating}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render grid section
  const renderGridSection = (title, data) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <View style={styles.gridContainer}>
          {data.map((item, index) => renderMovieCard(item, index))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No films found</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading films...</Text>
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
              placeholder="Search films..."
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
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Films')}>
              <Text style={[styles.menuText, styles.activeMenuText]}>Films</Text>
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

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
          />
        }
        contentContainerStyle={styles.scrollContent}
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
              Continue tracking your films
            </Text>
          </View>
        )}

        {searchQuery ? (
          // Search Results in Grid
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Search Results for "{searchQuery}" ({filteredFilms.length})
            </Text>
            {filteredFilms.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredFilms.map((item, index) => renderMovieCard(item, index))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No films found matching your search</Text>
            )}
          </View>
        ) : (
          // Regular Film Sections in Grid
          <>
            {/* New Films on TrackR - 9 per line grid */}
            {renderGridSection('New Films on TrackR', newFilms)}

            {/* Popular Films on TrackR - 9 per line grid */}
            {renderGridSection('Popular Films on TrackR', popularFilms)}

            {/* All Films - 9 per line grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Films ({allFilms.length})</Text>
              {allFilms.length > 0 ? (
                <View style={styles.gridContainer}>
                  {allFilms.map((item, index) => renderMovieCard(item, index))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No films available</Text>
              )}
            </View>
          </>
        )}

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
  // Header Styles (Exactly like HomeScreen)
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
  movieCard: {},
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
    backgroundColor: '#00D084',
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  localBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
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

export default FilmsScreen;