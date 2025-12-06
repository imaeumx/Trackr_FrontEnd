// src/screens/PlaylistScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import FeaturedCarousel from '../components/FeaturedCarousel'; // Add this import
import CustomScrollView from '../components/CustomScrollView';
import Toast from '../components/Toast';
import { playlistService } from '../services/playlistService';
import { authService } from '../services/auth';
import { globalStyles, colors } from '../styles/globalStyles';
import { useAuth } from '../hooks/useAuth';

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
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isLoggedIn) {
        loadPlaylists();
      }
    });
    return unsubscribe;
  }, [navigation, isLoggedIn]);

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

  const statusOrderLower = ['to watch', 'watching', 'watched'];

  const sortPlaylists = (arr) => {
    const normalizeTitle = (t = '') => t.trim().toLowerCase();

    const sorted = [...arr].sort((a, b) => {
      const aTitleNorm = normalizeTitle(a.title);
      const bTitleNorm = normalizeTitle(b.title);
      const aStatusIdx = statusOrderLower.indexOf(aTitleNorm);
      const bStatusIdx = statusOrderLower.indexOf(bTitleNorm);
      const aIsStatus = aStatusIdx !== -1;
      const bIsStatus = bStatusIdx !== -1;

      // Pin main status playlists at top: To Watch, Watching, Watched
      if (aIsStatus && !bIsStatus) return -1;
      if (!aIsStatus && bIsStatus) return 1;
      if (aIsStatus && bIsStatus) return aStatusIdx - bStatusIdx;

      // For everything else (including "Did Not Finish"), sort by update time
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return aTitleNorm.localeCompare(bTitleNorm);
    });

    return sorted;
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
      const arr = Array.isArray(playlistsData) ? playlistsData : (playlistsData.results || []);
      const sorted = sortPlaylists(arr);
      setPlaylists(sorted);

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

  const getFilteredLists = () => {
    if (!searchQuery.trim()) {
      return playlists;
    }
    return playlists.filter(list =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to search playlists.');
      return;
    }
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
    // Open modal for cross-platform input
    setNewPlaylistTitle('');
    setNewPlaylistDescription('');
    setCreateModalVisible(true);
  };

  const handleSubmitCreatePlaylist = async () => {
    try {
      if (!newPlaylistTitle || !newPlaylistTitle.trim()) {
        Alert.alert('Error', 'Playlist title is required');
        return;
      }
      const created = await playlistService.createPlaylist({ 
        title: newPlaylistTitle.trim(),
        description: newPlaylistDescription.trim()
      });
      Alert.alert('Success', `Playlist "${created.title}" created`);
      setCreateModalVisible(false);
      setNewPlaylistTitle('');
      setNewPlaylistDescription('');
      loadPlaylists();
    } catch (err) {
      console.error('Create playlist error:', err);
      Alert.alert('Error', 'Failed to create playlist');
    }
  };

  const handlePlaylistPress = (playlist) => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view playlists.');
      navigation.navigate('Sign In');
      return;
    }
    
    if (selectionMode) {
      togglePlaylistSelection(playlist.id);
    } else {
      // Navigate to PlaylistDetail screen
      navigation.navigate('PlaylistDetail', {
        playlistId: playlist.id,
        playlistTitle: playlist.title
      });
    }
  };

  const togglePlaylistSelection = (playlistId) => {
    // Find the playlist to check if it's a system playlist
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist?.is_status_playlist) {
      showToast('System playlists cannot be deleted', 'error');
      return;
    }
    
    if (selectedPlaylists.includes(playlistId)) {
      setSelectedPlaylists(selectedPlaylists.filter(id => id !== playlistId));
    } else {
      setSelectedPlaylists([...selectedPlaylists, playlistId]);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPlaylists([]);
  };

  const selectAll = () => {
    // Filter out system playlists from selection
    const selectablePlaylists = playlists.filter(p => !p.is_status_playlist);
    
    if (selectedPlaylists.length === selectablePlaylists.length) {
      setSelectedPlaylists([]);
    } else {
      setSelectedPlaylists(selectablePlaylists.map(list => list.id));
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDeleteAction = async () => {
    const count = selectedPlaylists.length;
    try {
      setShowBulkDeleteConfirm(false);
      setLoading(true);
      
      // Perform bulk delete
      await Promise.all(
        selectedPlaylists.map(playlistId =>
          playlistService.deletePlaylist(playlistId)
        )
      );
      
      setSelectedPlaylists([]);
      setSelectionMode(false);
      loadPlaylists();
      
      setToast({
        visible: true,
        message: `${count} ${count === 1 ? 'list' : 'lists'} deleted successfully`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error bulk deleting playlists:', error);
      setToast({
        visible: true,
        message: 'Failed to delete playlists',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteButtonPress = () => {
    if (selectionMode && selectedPlaylists.length > 0) {
      handleBulkDelete();
    } else {
      toggleSelectionMode();
    }
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

  const handleDeleteConfirm = async () => {
    if (!playlistToDelete) return;

    try {
      console.log('=== DELETE CONFIRMED ===');
      console.log('Deleting playlist ID:', playlistToDelete.id);
      
      setDeleteModalVisible(false);
      setLoading(true);
      
      const result = await playlistService.deletePlaylist(playlistToDelete.id);
      console.log('Delete API result:', result);
      
      console.log('Reloading playlists...');
      await loadPlaylists();
      console.log('Playlists reloaded successfully');
      
      setPlaylistToDelete(null);
      
    } catch (err) {
      console.error('=== DELETE ERROR ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error formatted:', err.formattedMessage);
      
      Alert.alert(
        'Error',
        err.formattedMessage || err.error || 'Failed to delete playlist. Please try again.'
      );
    } finally {
      console.log('Delete operation finished, setting loading to false');
      setLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    console.log('Delete cancelled by user');
    setDeleteModalVisible(false);
    setPlaylistToDelete(null);
  };

  const renderPlaylistItem = ({ item }) => {
    const isSelected = selectedPlaylists.includes(item.id);
    const isSystemPlaylist = item.is_status_playlist;
    
    const handleDeletePress = () => {
      console.log('=== DELETE BUTTON PRESSED ===');
      console.log('Playlist ID:', item.id);
      console.log('Playlist Title:', item.title);
      console.log('Is Logged In:', isLoggedIn);
      console.log('Current User:', currentUser);
      
      if (!isLoggedIn) {
        console.log('User not logged in, showing sign in alert');
        navigation.navigate('Sign In');
        return;
      }
      
      if (isSystemPlaylist) {
        showToast('System playlists cannot be deleted', 'error');
        return;
      }
      
      setPlaylistToDelete(item);
      setDeleteModalVisible(true);
    };

    return (
      <View style={[
        styles.playlistCard,
        isSelected && { borderLeftWidth: 4, borderLeftColor: colors.primary }
      ]}>
        {selectionMode && !isSystemPlaylist && (
          <View style={styles.checkbox}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </View>
        )}
        {selectionMode && isSystemPlaylist && (
          <View style={styles.checkbox}>
            <Ionicons 
              name="lock-closed" 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
        )}
        <TouchableOpacity
          style={styles.playlistCardTouchable}
          onPress={() => handlePlaylistPress(item)}
          onLongPress={() => {
            if (!selectionMode && !isSystemPlaylist) {
              setSelectionMode(true);
              togglePlaylistSelection(item.id);
            } else if (selectionMode && isSystemPlaylist) {
              showToast('System playlists cannot be deleted', 'error');
            }
          }}
        >
          <View style={styles.playlistIcon}>
            <Ionicons name="list" size={24} color={colors.primary} />
          </View>
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistTitle}>
              {item.title}
            </Text>
            <Text style={styles.playlistDescription}>
              {item.description || 'No description'}
            </Text>
            <Text style={styles.playlistStats}>
              {item.movie_count || 0} items
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCreatePlaylistCard = () => (
    <TouchableOpacity
      style={styles.createPlaylistCard}
      onPress={handleCreatePlaylist}
    >
      <Ionicons name="add-circle" size={32} color={colors.primary} />
      <Text style={styles.createPlaylistText}>Create New List</Text>
    </TouchableOpacity>
  );

  const renderDeletePlaylistButton = () => (
    <TouchableOpacity 
      style={[
        styles.deletePlaylistCard,
        selectionMode && selectedPlaylists.length > 0 && { backgroundColor: colors.error }
      ]}
      onPress={handleDeleteButtonPress}
    >
      <Ionicons 
        name="trash" 
        size={32} 
        color={selectionMode && selectedPlaylists.length > 0 ? "#FFFFFF" : colors.error} 
      />
      <Text style={[
        styles.deletePlaylistText, 
        { color: selectionMode && selectedPlaylists.length > 0 ? "#FFFFFF" : colors.error }
      ]}>
        {selectionMode && selectedPlaylists.length > 0 ? `Delete (${selectedPlaylists.length})` : 'Select to Delete'}
      </Text>
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
      <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[globalStyles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <Header
        navigation={navigation}
        activeScreen="Playlist"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onProfilePress={handleProfilePress}
        searchPlaceholder={isLoggedIn ? "Search watchlist..." : "Sign in to search..."}
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
            
            {/* Selection Mode and Create Playlist Card */}
            <View style={styles.playlistControlsContainer}>
              {renderCreatePlaylistCard()}
              {renderDeletePlaylistButton()}
            </View>

            {/* Playlists List */}
            <View style={globalStyles.section}>
              <View style={styles.listHeaderContainer}>
                <Text style={globalStyles.sectionTitle}>Your Lists ({playlists.length})</Text>
                {playlists.length > 0 && (
                  <View style={styles.selectionControls}>
                    <TouchableOpacity onPress={handleRefresh}>
                      <Ionicons 
                        name="reload" 
                        size={20} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleSelectionMode}>
                      <Ionicons 
                        name={selectionMode ? "close-circle" : "checkmark-circle-outline"} 
                        size={24} 
                        color={colors.text} 
                      />
                    </TouchableOpacity>
                    {selectionMode && (
                      <TouchableOpacity onPress={selectAll}>
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                          {selectedPlaylists.length === playlists.length ? 'Deselect All' : 'Select All'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              {playlists.length > 0 ? (
                <>
                  {getFilteredLists().length > 0 ? (
                    <FlatList
                      data={getFilteredLists()}
                      renderItem={renderPlaylistItem}
                      keyExtractor={item => item.id.toString()}
                      scrollEnabled={true}
                    />
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="list" size={48} color={colors.textSecondary} />
                      <Text style={styles.emptyTitle}>No playlists found</Text>
                      <Text style={styles.emptySubtitle}>No matching playlists</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="list" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No lists yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create your first list to organize your movies and series
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Extra space to ensure scrolling works */}
        <View style={globalStyles.bottomPadding} />
      </CustomScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={createModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter playlist name"
              placeholderTextColor={colors.textSecondary}
              value={newPlaylistTitle}
              onChangeText={setNewPlaylistTitle}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, { height: 80, marginTop: 12 }]}
              placeholder="Enter description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newPlaylistDescription}
              onChangeText={setNewPlaylistDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewPlaylistTitle('');
                  setNewPlaylistDescription('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSubmitCreatePlaylist}
              >
                <Text style={styles.modalButtonTextConfirm}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color={colors.error} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Delete Playlist</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete "{playlistToDelete?.title}"?
            </Text>
            <Text style={styles.deleteModalWarning}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleDeleteCancel}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.modalButtonTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        visible={showBulkDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBulkDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons 
              name="warning" 
              size={48} 
              color={colors.error} 
              style={{ alignSelf: 'center', marginBottom: 16 }} 
            />
            <Text style={styles.modalTitle}>Delete Playlists</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete {selectedPlaylists.length} {selectedPlaylists.length === 1 ? 'playlist' : 'playlists'}?
            </Text>
            <Text style={styles.deleteModalWarning}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowBulkDeleteConfirm(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmBulkDeleteAction}
              >
                <Text style={styles.modalButtonTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

// Playlist-specific styles
const styles = {
  playlistCard: {
    backgroundColor: colors.card,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistCardTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    color: colors.text,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playlistControlsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  createPlaylistCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    flex: 1,
    minHeight: 120,
  },
  createPlaylistIcon: {
    marginBottom: 8,
  },
  createPlaylistText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  deletePlaylistCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.error,
    borderStyle: 'dashed',
    flex: 1,
    minHeight: 120,
  },
  deletePlaylistText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    marginRight: 12,
    paddingLeft: 7,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.error,
    borderRadius: 8,
    flex: 1,
  },
  deleteButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default PlaylistScreen;
