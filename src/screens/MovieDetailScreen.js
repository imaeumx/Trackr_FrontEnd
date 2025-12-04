// src/screens/MovieDetailScreen.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';
import { movieService } from '../services/movieService';
import { playlistService } from '../services/playlistService';
import { useAuth } from '../hooks/useAuth';

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie: movieParam, movieId, mediaType, tmdbId } = route.params || {};
  const [movie, setMovie] = useState(movieParam || null);
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [watchStatus, setWatchStatus] = useState('');
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreatePlaylistInput, setShowCreatePlaylistInput] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [loadingTrailer, setLoadingTrailer] = useState(false);
  
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const loadMovieDetails = async () => {
      const tmdb = tmdbId || movieId || movieParam?.id;
      const type = mediaType || movieParam?.type || 'movie';
      
      // If we have movieParam, use it immediately as fallback
      if (movieParam) {
        setMovieDetails(movieParam);
        setLoading(false);
        
        // Then fetch fresh data if we have a tmdbId
        if (!tmdb) return;
      } else if (!tmdb) {
        setError('No movie information provided');
        setLoading(false);
        return;
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        // Decide whether to fetch TV or movie details
        if (type === 'tv' || type === 'series') {
          const tv = await movieService.getTVDetails(tmdb);
          setMovieDetails({
            id: tv.id,
            title: tv.name || tv.title,
            type: 'series',
            rating: tv.vote_average ? (tv.vote_average / 2).toFixed(1) : 'N/A',
            year: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A',
            overview: tv.overview,
            poster_path: tv.poster_path ? `https://image.tmdb.org/t/p/w500${tv.poster_path}` : null,
            backdrop_path: tv.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` : null,
            genres: tv.genres || [],
            runtime: tv.episode_run_time?.[0] || tv.runtime || 'N/A',
            status: tv.status || 'N/A',
            tagline: tv.tagline || '',
            vote_average: tv.vote_average || 0,
            vote_count: tv.vote_count || 0,
            seasons: tv.number_of_seasons || 0,
            episodes: tv.number_of_episodes || 0,
          });
        } else {
          const m = await movieService.getMovieDetails(tmdb);
          setMovieDetails({
            id: m.id,
            title: m.title || m.name,
            type: 'movie',
            rating: m.vote_average ? (m.vote_average / 2).toFixed(1) : 'N/A',
            year: m.release_date ? new Date(m.release_date).getFullYear() : 'N/A',
            overview: m.overview,
            poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
            backdrop_path: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
            genres: m.genres || [],
            runtime: m.runtime || 'N/A',
            status: m.status || 'N/A',
            tagline: m.tagline || '',
            vote_average: m.vote_average || 0,
            vote_count: m.vote_count || 0,
            budget: m.budget || 0,
            revenue: m.revenue || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError('Failed to load movie details.');
        
        // If we have movieParam, use it as fallback
        if (movieParam) {
          setMovieDetails(movieParam);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMovieDetails();
  }, [movieParam, movieId, mediaType, tmdbId]);

  // Fetch trailer after movie details are loaded
  useEffect(() => {
    if (!movieDetails) return;

    const fetchTrailer = async () => {
      setLoadingTrailer(true);
      try {
        const tmdb = tmdbId || movieId || movieParam?.id || movieDetails?.id;
        const type = mediaType || movieParam?.type || movieDetails?.type || 'movie';
        
        if (!tmdb) return;

        let url;
        if (type === 'tv' || type === 'series') {
          url = await movieService.getTVTrailers(tmdb);
        } else {
          url = await movieService.getMovieTrailers(tmdb);
        }

        if (url) {
          setTrailerUrl(url);
        }
      } catch (error) {
        console.log('Failed to fetch trailer:', error);
      } finally {
        setLoadingTrailer(false);
      }
    };

    fetchTrailer();
  }, [movieDetails]);

  const handleAddToList = async () => {
    // Check if user is logged in
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to add movies to your list',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Sign In')
          }
        ]
      );
      return;
    }

    // Fetch user's playlists
    try {
      setLoadingPlaylists(true);
      const playlistsResponse = await playlistService.getPlaylists();
      
      // Handle both array response and object with results
      const userPlaylists = Array.isArray(playlistsResponse) 
        ? playlistsResponse 
        : (playlistsResponse.results || []);
      
      // Show modal even if no playlists - user can create one
      setPlaylists(userPlaylists);
      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      Alert.alert('Error', 'Failed to load playlists. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleSelectPlaylist = async (playlistId) => {
    try {
      setShowPlaylistModal(false);
      
      // Get TMDB ID and media type from movieDetails
      const tmdbId = movieDetails?.id || movieDetails?.tmdb_id;
      const mediaType = movieDetails?.type === 'series' ? 'tv' : 'movie';
      
      if (!tmdbId) {
        Alert.alert('Error', 'Movie information is missing. Please try again.');
        return;
      }

      // First, ensure the movie exists in the backend database
      let movieIdToAdd;
      try {
        console.log('Creating/getting movie in backend:', { tmdbId, mediaType });
        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        movieIdToAdd = createdMovie.id;
        console.log('Movie created/found with ID:', movieIdToAdd);
      } catch (err) {
        console.error('Error creating movie in backend:', err);
        Alert.alert('Error', 'Failed to add movie to backend. Please try again.');
        return;
      }

      // Add movie to selected playlist
      console.log('Adding movie to playlist:', { playlistId, movieIdToAdd });
      await playlistService.addMovieToPlaylist(playlistId, movieIdToAdd, 'to_watch');
      Alert.alert('Success', 'Movie added to your playlist!');
    } catch (error) {
      console.error('Error adding to playlist:', error);
      if (error.error === 'Movie already in playlist') {
        Alert.alert('Already Added', 'This movie is already in that playlist.');
      } else {
        Alert.alert('Error', error.formattedMessage || 'Failed to add movie to playlist. Please try again.');
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

      if (movieDetails) {
        const tmdbId = movieDetails.id || movieDetails.tmdb_id;
        const mediaType = movieDetails.type === 'series' ? 'tv' : 'movie';
        const createdMovie = await movieService.getOrCreateMovie(tmdbId, mediaType);
        await playlistService.addMovieToPlaylist(newPlaylist.id, createdMovie.id, 'to_watch');
      }

      Alert.alert('Success', `Created playlist "${newPlaylistName}" and added movie!`);
      setShowCreatePlaylistInput(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setShowPlaylistModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', 'Failed to create playlist. Please try again.');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleRate = (rating) => {
    setUserRating(rating);
    Alert.alert('Rating Added', `You rated this ${rating} stars`);
  };

  const handleSetStatus = (status) => {
    setWatchStatus(status);
    Alert.alert('Status Updated', `Marked as ${status}`);
  };

  const formatRuntime = (minutes) => {
    if (!minutes || minutes === 'N/A') return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount <= 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.loadingText, { color: colors.textSecondary }]}>Loading details...</Text>
      </View>
    );
  }

  if (error || !movieDetails) {
    return (
      <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.errorTitle}>Error</Text>
        </View>
        <View style={styles.errorContent}>
          <Text style={globalStyles.errorText}>{error || 'No movie data available.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Close button in header - upper right */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movieDetails.title}
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CustomScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: Dimensions.get('window').height, paddingTop: 130 }}>
        {/* Backdrop Image or Trailer Video */}
        {trailerUrl ? (
          <View style={styles.backdropVideo}>
            {typeof document !== 'undefined' && (
              <iframe
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                src={`${trailerUrl}?autoplay=1&mute=1&controls=1`}
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            )}
            {loadingTrailer && (
              <View style={styles.trailerLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
        ) : movieDetails.backdrop_path ? (
          <Image
            source={{ uri: movieDetails.backdrop_path }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.backdropPlaceholder}>
              <Ionicons 
              name={movieDetails.type === 'movie' ? 'film' : 'tv'} 
              size={64} 
              color={colors.textSecondary} 
            />
          </View>
        )}

        {/* Poster and Basic Info */}
        <View style={styles.posterSection}>
          {movieDetails.poster_path ? (
            <Image
              source={{ uri: movieDetails.poster_path }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Ionicons 
                name={movieDetails.type === 'movie' ? 'film' : 'tv'} 
                size={48} 
                color={colors.textSecondary} 
              />
            </View>
          )}
          
          <View style={styles.basicInfo}>
            <Text style={styles.title}>{movieDetails.title}</Text>
            <Text style={styles.tagline}>{movieDetails.tagline}</Text>
            
            <Text style={styles.type}>{movieDetails.type.toUpperCase()}</Text>
            <Text style={styles.year}>{movieDetails.year}</Text>
          </View>
        </View>

        {/* Action Buttons - Only for logged in users */}
        {isLoggedIn && (
          <View style={styles.actions}>
            <View style={styles.statusButtons}>
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'Watched' && styles.statusActive]}
                onPress={() => handleSetStatus('Watched')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'Watched' && styles.statusActiveText]}>
                  Watched
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'Watching' && styles.statusActive]}
                onPress={() => handleSetStatus('Watching')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'Watching' && styles.statusActiveText]}>
                  Watching
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.statusButton, watchStatus === 'To Watch' && styles.statusActive]}
                onPress={() => handleSetStatus('To Watch')}
              >
                <Text style={[styles.statusButtonText, watchStatus === 'To Watch' && styles.statusActiveText]}>
                  To Watch
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToList}>
              <Text style={styles.addButtonText}>Add to List</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details Section */}
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.description}>
            {movieDetails.overview || 'No description available.'}
          </Text>
          
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{movieDetails.type}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{movieDetails.status}</Text>
            </View>
            
            {isLoggedIn && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Rating</Text>
                <View style={styles.ratingDisplay}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text style={styles.infoValue}> {movieDetails.rating}/5</Text>
                </View>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Runtime</Text>
              <Text style={styles.infoValue}>{formatRuntime(movieDetails.runtime)}</Text>
            </View>
            
            {movieDetails.type === 'series' ? (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Seasons</Text>
                  <Text style={styles.infoValue}>{movieDetails.seasons}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Episodes</Text>
                  <Text style={styles.infoValue}>{movieDetails.episodes}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Budget</Text>
                  <Text style={styles.infoValue}>{formatCurrency(movieDetails.budget)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Revenue</Text>
                  <Text style={styles.infoValue}>{formatCurrency(movieDetails.revenue)}</Text>
                </View>
              </>
            )}
          </View>
          
          {/* Genres */}
          {movieDetails.genres && movieDetails.genres.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresContainer}>
                {movieDetails.genres.map((genre, index) => (
                  <View key={genre.id || index} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
        
        {/* Extra padding at bottom */}
        <View style={{ height: 50 }} />
      </CustomScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'rgba(26, 27, 29, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  backdropImage: {
    width: '100%',
    height: 400,
  },
  backdropVideo: {
    width: '100%',
    height: 400,
    position: 'relative',
    backgroundColor: '#000',
  },
  trailerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backdropPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 20,
    backgroundColor: colors.card,
    marginTop: -50,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  posterPlaceholder: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    color: colors.warning,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 8,
  },
  voteCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  type: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  statusActiveText: {
    color: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  genreBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 40,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    padding: 20,
    fontSize: 16,
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

export default MovieDetailScreen;
