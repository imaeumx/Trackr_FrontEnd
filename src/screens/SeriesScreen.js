// src/screens/SeriesScreen.js
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
import { useAuth } from '../hooks/useAuth';

const SeriesScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newSeries, setNewSeries] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Use the auth hook
  const { isLoggedIn, currentUser, signOut } = useAuth();

  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 80) / 9;
  const cardHeight = cardWidth * 1.4;

  useEffect(() => {
    loadSeriesData();
  }, []);

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
      // Remove duplicates based on title
      const uniqueSeries = combinedSeries.filter((series, index, self) =>
        index === self.findIndex(s => s.title === series.title)
      );
      setAllSeries(uniqueSeries);
      setFilteredSeries(uniqueSeries);

    } catch (error) {
      console.error('Error loading series data:', error);
      setError('Failed to load series. Please check your connection.');
      // Set empty arrays to avoid crashes
      setPopularSeries([]);
      setNewSeries([]);
      setAllSeries([]);
      setFilteredSeries([]);
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

  // Render series card in grid layout
  const renderSeriesCard = (item, index) => (
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
        mediaType: 'tv'
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
            <Ionicons name="tv" size={14} color="#7B7C7D" />
          </View>
        )}
        <View style={[
          styles.typeBadge,
          { backgroundColor: '#FF6B35' } // Orange for series
        ]}>
          <Text style={styles.typeText}>SERIES</Text>
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

  // Render grid section
  const renderGridSection = (title, data) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <View style={styles.gridContainer}>
          {data.map((item, index) => renderSeriesCard(item, index))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No series found</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading series...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header - Same as HomeScreen */}
      <View style={styles.header}>
        <Text style={styles.logo}>TrackR</Text>
        
        {/* Menu and Search combined on the right side */}
        <View style={styles.rightContainer}>

          {/* Search next to menu */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search series..."
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
          
          {/* Menu items - Home Films Series Playlist */}
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Films')}>
              <Text style={styles.menuText}>Films</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Series')}>
              <Text style={[styles.menuText, styles.activeMenuText]}>Series</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
              <Text style={styles.menuText}>Playlist</Text>
            </TouchableOpacity>
          </View>

          {/* Profile / Sign In */}
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
              Continue tracking your series
            </Text>
          </View>
        )}

        {searchQuery ? (
          // Search Results in Grid
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Search Results for "{searchQuery}" ({filteredSeries.length})
            </Text>
            {filteredSeries.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredSeries.map((item, index) => renderSeriesCard(item, index))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No series found matching your search</Text>
            )}
          </View>
        ) : (
          // Regular Series Sections in Grid
          <>
            {/* New Series on TrackR - 9 per line grid */}
            {renderGridSection('New Series on TrackR', newSeries)}

            {/* Popular Series on TrackR - 9 per line grid */}
            {renderGridSection('Popular Series on TrackR', popularSeries)}

            {/* All Series - 9 per line grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Series ({allSeries.length})</Text>
              {allSeries.length > 0 ? (
                <View style={styles.gridContainer}>
                  {allSeries.map((item, index) => renderSeriesCard(item, index))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No series available</Text>
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

export default SeriesScreen;