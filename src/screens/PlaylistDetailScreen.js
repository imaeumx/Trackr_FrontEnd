// src/screens/PlaylistDetailScreen.js
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playlistService } from '../services/playlistService';
import { globalStyles, colors } from '../styles/globalStyles';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import CustomScrollView from '../components/CustomScrollView';

const PlaylistDetailScreen = ({ route, navigation }) => {
      // Reload if coming from edit screen
      useEffect(() => {
        if (route?.params?.reload) {
          (async () => {
            setLoading(true);
            try {
              const fetchedPlaylist = await playlistService.getPlaylist(playlistId);
              setPlaylist(fetchedPlaylist);
            } catch (error) {
              console.error('Error fetching playlist:', error);
            } finally {
              setLoading(false);
            }
          })();
          // Clear reload param so it doesn't keep reloading
          navigation.setParams({ ...route.params, reload: false });
        }
      }, [route?.params?.reload]);
    // Bulk delete handler for button
    const handleBulkDelete = () => {
      if (selectedItems.length > 0) {
        setShowBulkDeleteModal(true);
      } else {
        setToast({ visible: true, message: 'No items selected.', type: 'error' });
        setTimeout(() => setToast({ visible: false }), 2000);
      }
    };
  const { playlistId, playlistTitle } = route?.params || {};
  const [playlist, setPlaylist] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [movieToRemove, setMovieToRemove] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [ratingItem, setRatingItem] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);
  const [showDeletePlaylistModal, setShowDeletePlaylistModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });

  const { user } = useAuth();
  const items = playlist?.items || [];

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) return;
      setLoading(true);
      try {
        const fetchedPlaylist = await playlistService.getPlaylist(playlistId);
        setPlaylist(fetchedPlaylist);
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId, refreshing]);

  // Force reload when returning from EditPlaylistScreen
  useFocusEffect(
    React.useCallback(() => {
      if (!playlistId) return;
      (async () => {
        setLoading(true);
        try {
          const fetchedPlaylist = await playlistService.getPlaylist(playlistId);
          setPlaylist(fetchedPlaylist);
        } catch (error) {
          console.error('Error fetching playlist:', error);
        } finally {
          setLoading(false);
        }
      })();
    }, [playlistId])
  );

  const handleMoviePress = (item) => {
    // Pass both TMDB ID and media type for robust navigation
    const movie = item.movie || item;
    const tmdbId = movie.tmdb_id || movie.id;
    const mediaType = movie.media_type || movie.type || (item.media_type || item.type);
    navigation.navigate('MovieDetail', { tmdbId, mediaType });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    setSelectedItems([]);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleRemoveMovie = (movieId, movieTitle) => {
    setMovieToRemove({ movieId, movieTitle });
    setDeleteModalVisible(true);
  };

  const handleRemoveConfirm = async () => {
    if (!movieToRemove) return;
    const { movieId, movieTitle } = movieToRemove;
    setDeleteModalVisible(false);
    try {
      await playlistService.removeMovieFromPlaylist(playlistId, movieId);
      setToast({ visible: true, message: `Removed "${movieTitle}" from playlist.`, type: 'success' });
      setRefreshing(true);
    } catch (error) {
      console.error('Error removing movie:', error);
      setToast({ visible: true, message: 'Failed to remove movie. Please try again.', type: 'error' });
    } finally {
      setMovieToRemove(null);
      setTimeout(() => setToast({ visible: false }), 3000);
    }
  };

  const handleRemoveCancel = () => {
    setDeleteModalVisible(false);
    setMovieToRemove(null);
  };

  const handleRefresh = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      const fetchedPlaylist = await playlistService.getPlaylist(playlistId);
      setPlaylist(fetchedPlaylist);
      setToast({ visible: true, message: 'Playlist reloaded.', type: 'success' });
    } catch (error) {
      setToast({ visible: true, message: 'Failed to reload playlist.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast({ visible: false }), 2000);
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingItem) return;
    try {
      await playlistService.rateMovieInPlaylist(ratingItem.id, userRating);
      setToast({ visible: true, message: 'Rating submitted. Thank you!', type: 'success' });
    } catch (error) {
      console.error('Error submitting rating:', error);
      setToast({ visible: true, message: 'Failed to submit rating. Please try again.', type: 'error' });
    } finally {
      setShowRatingModal(false);
      setUserRating(0);
      setRatingItem(null);
      setTimeout(() => setToast({ visible: false }), 3000);
    }
  };

  const confirmBulkDelete = async () => {
    setShowBulkDeleteModal(false);
    try {
      for (const itemId of selectedItems) {
        await playlistService.removeMovieFromPlaylist(playlistId, itemId);
      }
      setToast({ visible: true, message: 'Selected items deleted.', type: 'success' });
      setRefreshing(true);
    } catch (error) {
      console.error('Error deleting items:', error);
      setToast({ visible: true, message: 'Failed to delete items. Please try again.', type: 'error' });
    } finally {
      setSelectedItems([]);
      setTimeout(() => setToast({ visible: false }), 3000);
    }
  };

  const selectAllItems = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.movie?.id || item.id));
    }
  };

  const hideToast = () => {
    setToast({ visible: false, message: '', type: '' });
  };

  const renderItem = ({ item }) => {
    const movie = item.movie || {};
    const movieId = movie.id || item.id;
    const movieTitle = movie.title || 'Unknown Movie';
    const isSelected = selectedItems.includes(movieId);
    return (
      <TouchableOpacity
        style={[
          styles.itemCard,
          isSelected && { backgroundColor: colors.primary + '10', borderLeftWidth: 4, borderLeftColor: colors.primary }
        ]}
        onPress={() => {
          if (selectionMode) {
            toggleItemSelection(movieId);
          } else {
            handleMoviePress(item);
          }
        }}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleItemSelection(movieId);
          }
        }}
        activeOpacity={0.7}
      >
        {selectionMode && (
          <View style={styles.checkbox}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
          </View>
        )}
        <View style={styles.posterContainer}>
          {movie.poster_url ? (
            <Image
              source={{ uri: movie.poster_url }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Ionicons
                name={movie.media_type === 'tv' ? 'tv' : 'film'}
                size={32}
                color={colors.textSecondary}
              />
            </View>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{movieTitle}</Text>
          {movie.release_year && (
            <Text style={styles.itemYear}>{movie.release_year}</Text>
          )}
        </View>
        {/* Remove Button */}
        {!selectionMode && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMovie(movieId, movieTitle)}
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
        {selectionMode && isSelected && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMovie(movieId, movieTitle)}
            activeOpacity={0.6}
          >
            <Ionicons name="trash" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading playlist...</Text>
      </View>
    );
  }

  if (!playlistId) {
    return (
      <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}> 
        <Text style={globalStyles.loadingText}>No playlist selected</Text>
      </View>
    );
  }

  // Delete playlist handler
  const handleDeletePlaylist = async () => {
    if (!playlistId) return;
    setDeletingPlaylist(true);
    try {
      await playlistService.deletePlaylist(playlistId);
      setToast({ visible: true, message: 'Playlist deleted successfully.', type: 'success' });
      setShowDeletePlaylistModal(false);
      navigation.goBack();
    } catch (error) {
      setToast({ visible: true, message: error?.formattedMessage || 'Failed to delete playlist.', type: 'error' });
    } finally {
      setDeletingPlaylist(false);
      setTimeout(() => setToast({ visible: false }), 3000);
    }
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background, flex: 1 }]}> 
      {/* Header (sticky, outside scroll) */}
      <View style={[styles.header, { backgroundColor: colors.card }]}> 
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectionMode ? `${selectedItems.length} Selected` : (playlistTitle || playlist?.title)}
          </Text>
          {!selectionMode && playlist?.description && (
            <Text style={[styles.headerDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {playlist.description}
            </Text>
          )}
          {!selectionMode && (
            <Text style={styles.itemCount}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          )}
          {selectionMode && items.length > 0 && (
            <TouchableOpacity onPress={selectAllItems}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {!selectionMode && !playlist?.is_status_playlist && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleRefresh}
              activeOpacity={0.6}
              style={styles.reloadButton}
            >
              <Ionicons name="reload" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPlaylist', {
                playlistId: playlistId,
                playlistTitle: playlist?.title || playlistTitle,
                playlistDescription: playlist?.description || '',
                isStatusPlaylist: playlist?.is_status_playlist || false
              })}
              activeOpacity={0.6}
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDeletePlaylistModal(true)}
              activeOpacity={0.6}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {selectionMode && selectedItems.length > 0 && (
            <TouchableOpacity 
              onPress={handleBulkDelete}
              activeOpacity={0.7}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="trash" size={22} color={colors.error} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={toggleSelectionMode} 
            activeOpacity={0.6}
            style={[
              styles.selectButton,
              selectionMode && { backgroundColor: colors.primary }
            ]}
          >
            <Text style={[
              styles.selectButtonText,
              selectionMode && { color: '#FFFFFF' }
            ]}>
              {selectionMode ? 'DONE' : 'SELECT'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Main scrollable content */}
      <CustomScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="film-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your playlist is empty</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Start adding movies and series!</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.7}
            >
              <Text style={styles.addButtonText}>Browse TrackR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => `${item.id}-${item.movie?.id}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
        {/* Bulk Delete Button removed for better UX */}
      </CustomScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRemoveCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons 
              name="warning" 
              size={48} 
              color={colors.error} 
              style={{ alignSelf: 'center', marginBottom: 16 }} 
            />
            <Text style={styles.modalTitle}>Remove Movie</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to remove "{movieToRemove?.movieTitle}" from this playlist?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleRemoveCancel}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleRemoveConfirm}
              >
                <Text style={styles.modalButtonTextDelete}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={[styles.ratingModalOverlay]}>
          <View style={[styles.ratingModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingModalTitle, { color: colors.text }]}>
              How would you rate this?
            </Text>
            <Text style={[styles.ratingModalSubtitle, { color: colors.textSecondary }]}>
              {ratingItem?.movie?.title || ratingItem?.title}
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setUserRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={48}
                    color={star <= userRating ? colors.warning : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {userRating > 0 && (
              <Text style={[styles.ratingText, { color: colors.warning }]}>
                {userRating} out of 5 stars
              </Text>
            )}

            {/* Buttons */}
            <View style={styles.ratingModalButtons}>
              <TouchableOpacity
                style={[styles.ratingModalButton, { borderColor: colors.border }]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={[styles.ratingModalButtonText, { color: colors.text }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ratingModalButton,
                  { backgroundColor: userRating > 0 ? colors.primary : colors.textSecondary }
                ]}
                onPress={handleSubmitRating}
                disabled={userRating === 0}
              >
                <Text style={styles.ratingModalButtonTextSubmit}>Save Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Delete Confirmation Modal (now matches single delete style) */}
      <Modal
        visible={showBulkDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBulkDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons 
              name="warning" 
              size={48} 
              color={colors.error} 
              style={{ alignSelf: 'center', marginBottom: 16 }} 
            />
            <Text style={styles.modalTitle}>Delete Items</Text>
            <Text style={styles.deleteModalMessage}>
              Are you sure you want to delete {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowBulkDeleteModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmBulkDelete}
              >
                <Text style={styles.modalButtonTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Playlist Confirmation Modal */}
      <Modal
        visible={showDeletePlaylistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeletePlaylistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color={colors.error} style={{ alignSelf: 'center', marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Delete List</Text>
            <Text style={styles.deleteModalMessage}>
              {`Delete "${playlist?.title || playlistTitle || 'this list'}"? This cannot be undone.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeletePlaylistModal(false)}
                disabled={deletingPlaylist}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={handleDeletePlaylist}
                disabled={deletingPlaylist}
              >
                {deletingPlaylist ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextDelete}>Delete</Text>
                )}
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
        onHide={hideToast}
      />
    </View>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  itemCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  descriptionContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  posterContainer: {
    width: 60,
    height: 90,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemYear: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  userRatingContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 32,
    backgroundColor: colors.card,
    minWidth: 280,
    maxWidth: 350,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonDelete: {
    backgroundColor: colors.error,
  },
  modalButtonTextCancel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextDelete: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  ratingModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  ratingModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  ratingModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  ratingModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingModalButtonTextSubmit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bulkActionContainer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  bulkDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  selectButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editButton: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    },
  deleteButton: {
    width: 35,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  reloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkDeleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkDeleteModalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 20,
    maxWidth: 350,
  },
};

export default PlaylistDetailScreen;
