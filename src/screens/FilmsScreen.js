// src/screens/FilmsScreen.js - UPDATED
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
import CustomScrollView from '../components/CustomScrollView';
import { movieService } from '../services/movieService';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import { shuffleArray } from '../utils/shuffle';

const FilmsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFilms, setFeaturedFilms] = useState([]); // Add this
  const [newFilms, setNewFilms] = useState([]);
  const [popularFilms, setPopularFilms] = useState([]);
  const [topRatedFilms, setTopRatedFilms] = useState([]);
  const [mostViewedFilms, setMostViewedFilms] = useState([]);
  const [actionFilms, setActionFilms] = useState([]);
  const [comedyFilms, setComedyFilms] = useState([]);
  const [allFilms, setAllFilms] = useState([]);
  const [filteredFilms, setFilteredFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = React.useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = React.useRef(null);
  
  const { isLoggedIn, currentUser, signOut } = useAuth();

  useEffect(() => {
    loadFilmsData();
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
          const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
          const BASE_URL = 'https://api.themoviedb.org/3';
          const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery.trim())}`
          );
          if (response.ok) {
            const data = await response.json();
            const filtered = data.results?.filter(item => 
              item.poster_path || item.title
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

  const fetchFromAPI = async (endpoint) => {
    try {
      const API_KEY = 'b5ae97629b66c7bff8eaa682cefcc1cf';
      const BASE_URL = 'https://api.themoviedb.org/3';
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
        image: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 
               item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'
      })) || [];

      setFeaturedFilms(featuredMovies);

      // Get popular movies (page 1)
      const popularData = await movieService.getPopularMovies('movie', 1);
      const popularMovies = popularData.results?.slice(0, 72).map(item => ({
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
      const newMovies = newData.results?.slice(0, 72).map(item => ({
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
        .slice(0, 72);

      // For most viewed, use page 3 of popular movies
      const mostViewedData = await movieService.getPopularMovies('movie', 3);
      const mostViewed = mostViewedData.results?.slice(0, 72).map(item => ({
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

      // Fetch Action movies
      const actionData = await fetchFromAPI('/discover/movie?with_genres=28&sort_by=popularity.desc');
      const actionMovies = actionData.results?.slice(0, 72).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview,
        vote_average: item.vote_average
      })) || [];

      // Fetch Comedy movies
      const comedyData = await fetchFromAPI('/discover/movie?with_genres=35&sort_by=popularity.desc');
      const comedyMovies = comedyData.results?.slice(0, 72).map(item => ({
        id: item.id,
        title: item.title,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date ? new Date(item.release_date).getFullYear() : 'N/A',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        description: item.overview,
        vote_average: item.vote_average
      })) || [];

      // Shuffle all film arrays for variety on each reload
      setPopularFilms(shuffleArray(popularMovies));
      setNewFilms(shuffleArray(newMovies));
      setTopRatedFilms(shuffleArray(topRated));
      setMostViewedFilms(shuffleArray(mostViewed));
      setActionFilms(shuffleArray(actionMovies));
      setComedyFilms(shuffleArray(comedyMovies));
      
      // Combine all movies
      const combinedFilms = [...popularMovies, ...newMovies, ...topRated, ...mostViewed, ...actionMovies, ...comedyMovies, ...localMovies];
      // Remove duplicates based on id
      const uniqueFilms = combinedFilms.filter((film, index, self) =>
        index === self.findIndex(f => f.id === film.id)
      );
      setAllFilms(shuffleArray(uniqueFilms));
      setFilteredFilms(shuffleArray(uniqueFilms));

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
      setActionFilms(sampleMovies);
      setComedyFilms(sampleMovies);
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

  const handleSearchResultPress = (item) => {
    setSearchQuery('');
    setSearchResults([]);
    navigation.navigate('MovieDetail', {
      movie: {
        id: item.id,
        title: item.title || item.name,
        type: 'movie',
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
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

  const handleMoviePress = (item) => {
    console.log('Film pressed:', item);
    
    navigation.navigate('MovieDetail', { 
      movieId: item.tmdbId || item.id,
      mediaType: item.mediaType || 'movie',
      movie: {
        id: item.tmdbId || item.id,
        title: item.title,
        type: item.type || 'movie',
        rating: item.rating,
        year: item.year || item.release_year,
        poster: item.poster || item.poster_url
      }
    });
  };

  const handleFeaturedPress = (item) => {
    console.log('Featured film pressed:', item);
    
    navigation.navigate('MovieDetail', {
      movieId: item.tmdbId || item.id,
      mediaType: item.mediaType || 'movie',
      movie: {
        id: item.tmdbId || item.id,
        title: item.title,
        type: item.type || 'movie',
        rating: item.rating,
        year: item.year || item.release_year,
        poster: item.poster
      }
    });
  };

  const handleAddToList = async (item) => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to add items to your playlists.');
      navigation.navigate('Sign In');
      return;
    }

    setSelectedMovie(item);
    
    try {
      setLoadingPlaylists(true);
      const userPlaylists = await playlistService.getPlaylists();
      const playlistsArray = Array.isArray(userPlaylists) ? userPlaylists : (userPlaylists.results || []);
      
      // Sort playlists: status playlists first, then by most recently updated
      const statusOrder = ['To Watch', 'Watching', 'Watched'];
      const sortedPlaylists = [...playlistsArray].sort((a, b) => {
        // Check is_status_playlist flag first
        const aIsStatus = a.is_status_playlist === true;
        const bIsStatus = b.is_status_playlist === true;
        
        if (aIsStatus && !bIsStatus) return -1;
        if (!aIsStatus && bIsStatus) return 1;
        
        // If both are status or both are user lists
        if (aIsStatus && bIsStatus) {
          const aIdx = statusOrder.indexOf(a.title);
          const bIdx = statusOrder.indexOf(b.title);
          return aIdx - bIdx;
        }
        
        // Sort user lists by updated_at (most recent first)
        const aTime = new Date(a.updated_at).getTime();
        const bTime = new Date(b.updated_at).getTime();
        return bTime - aTime;
      });
      
      setPlaylists(sortedPlaylists);
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
      const mediaType = 'movie';

      const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
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

      if (selectedMovie) {
        const tmdbId = selectedMovie.tmdbId || selectedMovie.id;
        const mediaType = 'movie';
        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        await playlistService.addMovieToPlaylist(newPlaylist.id, createdMovie.id, 'to_watch');
      }

      Alert.alert('Success', `Created playlist "${newPlaylistName}" and added movie!`);
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

        {/* Featured Films Carousel */}
        <FeaturedCarousel
          title="Featured Films"
          items={featuredFilms}
          onItemPress={handleFeaturedPress}
          autoPlay={true}
        />

        {/* New Films on TrackR */}
        <GridSection
          title="New Films on TrackR"
          data={newFilms}
          onItemPress={handleMoviePress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

        {/* Popular Films on TrackR */}
        <GridSection
          title="Popular Films on TrackR"
          data={popularFilms}
          onItemPress={handleMoviePress}
          onAddToList={handleAddToList}
          isLoggedIn={isLoggedIn}
        />

            {/* Top Rated Movies */}
            <GridSection
              title="Top Rated Movies"
              data={topRatedFilms}
              onItemPress={handleMoviePress}
              onAddToList={handleAddToList}
              isLoggedIn={isLoggedIn}
            />

            {/* Most Viewed Movies */}
            <GridSection
              title="Most Viewed Movies"
              data={mostViewedFilms}
              onItemPress={handleMoviePress}
              onAddToList={handleAddToList}
              isLoggedIn={isLoggedIn}
            />

            {/* Action Movies */}
            <GridSection
              title="Action Movies"
              data={actionFilms}
              onItemPress={handleMoviePress}
              onAddToList={handleAddToList}
              isLoggedIn={isLoggedIn}
            />

            {/* Comedy Movies */}
            <GridSection
              title="Comedy Movies"
              data={comedyFilms}
              onItemPress={handleMoviePress}
              onAddToList={handleAddToList}
              isLoggedIn={isLoggedIn}
            />

            {/* All Films */}
            <GridSection
              title={`All Films (${allFilms.length})`}
              data={allFilms}
              onItemPress={handleMoviePress}
              onAddToList={handleAddToList}
              isLoggedIn={isLoggedIn}
              showLocalBadge={true}
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

export default FilmsScreen;