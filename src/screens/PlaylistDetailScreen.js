// src/screens/PlaylistDetailScreen.js
import React, { useState, useEffect } from 'react';
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
import Toast from '../components/Toast';

const PlaylistDetailScreen = ({ route, navigation }) => {
  const { playlistId, playlistTitle } = route?.params || {};
  const [playlist, setPlaylist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [movieToRemove, setMovieToRemove] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingItem, setRatingItem] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (playlistId) {
      loadPlaylistDetails();
    } else {
      // If no playlistId, stop loading immediately
      setLoading(false);
    }
  }, [playlistId]);

  // Reload when screen comes into focus (e.g., after editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (playlistId) {
        loadPlaylistDetails();
      }
    });

    return unsubscribe;
  }, [navigation, playlistId]);

  const loadPlaylistDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading playlist details for ID:', playlistId);
      
      // Fetch playlist details
      const playlistData = await playlistService.getPlaylist(playlistId);
      console.log('Playlist data:', playlistData);
      setPlaylist(playlistData);
      
      // Get playlist items - use items from getPlaylist if available, otherwise fetch separately
      const itemsData = playlistData.items || await playlistService.getPlaylistItems(playlistId);
      console.log('Items data:', itemsData);
      setItems(itemsData);
      
    } catch (error) {
      console.error('Error loading playlist details:', error);
      Alert.alert(
        'Error',
        error.formattedMessage || 'Failed to load playlist details.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlaylistDetails();
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    try {
      console.log('Updating status:', { itemId, newStatus });
      
      await playlistService.updateMovieStatus(playlistId, itemId, newStatus);
      
      // Update local state
      const updatedItems = items.map(item => {
        if (item.movie?.id === itemId || item.id === itemId) {
          return { ...item, status: newStatus };
        }
        return item;
      });
      setItems(updatedItems);
      
      setShowStatusModal(false);
      
      // If marking as watched, show rating modal
      if (newStatus === 'watched') {
        setRatingItem(selectedItem);
        setUserRating(0);
        setShowRatingModal(true);
      } else {
        Alert.alert('Success', 'Status updated successfully');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert(
        'Error',
        error.formattedMessage || 'Failed to update status.'
      );
    }
  };

  const handleRemoveMovie = (itemId, movieTitle) => {
    console.log('Remove movie called with:', { itemId, movieTitle });
    
    // Open modal instead of Alert
    setMovieToRemove({ itemId, movieTitle });
    setDeleteModalVisible(true);
  };

  const handleRemoveConfirm = async () => {
    if (!movieToRemove) return;

    const { itemId, movieTitle } = movieToRemove;

    try {
      console.log('Remove confirmed! Removing movie:', { itemId, playlistId });
      
      setDeleteModalVisible(false);
      setLoading(true);
      
      const result = await playlistService.removeMovieFromPlaylist(playlistId, itemId);
      console.log('Remove result:', result);
      
      // Update local state - filter out the removed item
      const updatedItems = items.filter(item => 
        item.movie?.id !== itemId && item.id !== itemId
      );
      setItems(updatedItems);
      
      setMovieToRemove(null);
      
    } catch (error) {
      console.error('Error removing movie:', error);
      Alert.alert(
        'Error',
        error.formattedMessage || 'Failed to remove movie.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCancel = () => {
    console.log('Remove cancelled');
    setDeleteModalVisible(false);
    setMovieToRemove(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems([]);
  };

  const toggleItemSelection = (movieId) => {
    if (selectedItems.includes(movieId)) {
      setSelectedItems(selectedItems.filter(id => id !== movieId));
    } else {
      setSelectedItems([...selectedItems, movieId]);
    }
  };

  const selectAllItems = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.movie?.id || item.id));
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    const count = selectedItems.length;
    setShowBulkDeleteModal(false);
    
    try {
      setLoading(true);
      // Delete each selected item
      await Promise.all(
        selectedItems.map(movieId => 
          playlistService.removeMovieFromPlaylist(playlistId, movieId)
        )
      );
      
      // Refresh the list
      await loadPlaylistDetails();
      setToast({
        visible: true,
        message: `${count} ${count === 1 ? 'item' : 'items'} deleted successfully`,
        type: 'success'
      });
      setSelectedItems([]);
      setSelectionMode(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      setToast({
        visible: true,
        message: 'Failed to delete some items. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoviePress = (item) => {
    if (selectionMode) {
      const movieId = item.movie?.id || item.id;
      toggleItemSelection(movieId);
      return;
    }
    
    if (item.movie) {
      navigation.navigate('MovieDetail', {
        movieId: item.movie.tmdb_id || item.movie.id,
        mediaType: item.movie.media_type || 'movie',
        movie: {
          id: item.movie.tmdb_id || item.movie.id,
          title: item.movie.title,
          type: item.movie.media_type || 'movie',
          rating: 4.0,
          year: item.movie.release_year,
          poster: item.movie.poster_url
        }
      });
    }
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      Alert.alert('Please Select a Rating', 'Please select a star rating before continuing.');
      return;
    }

    try {
      // Save rating to backend
      await playlistService.updateMovieRating(playlistId, ratingItem?.movieId, userRating);
      
      // Update local state to show rating immediately
      const updatedItems = items.map(item => {
        if (item.movie?.id === ratingItem?.movieId || item.id === ratingItem?.movieId) {
          return { ...item, user_rating: userRating };
        }
        return item;
      });
      setItems(updatedItems);
      
      setShowRatingModal(false);
      Alert.alert(
        'Rating Saved',
        `You rated this ${ratingItem?.movie?.media_type === 'tv' ? 'series' : 'movie'} ${userRating} out of 5 stars!`
      );
    } catch (error) {
      console.error('Error saving rating:', error);
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watched': return colors.primary;
      case 'watching': return colors.warning;
      case 'to_watch': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'watched': return 'Watched';
      case 'watching': return 'Watching';
      case 'to_watch': return 'To Watch';
      default: return status;
    }
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
        onPress={() => handleMoviePress(item)}
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
        
        {/* Movie Poster */}
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

        {/* Movie Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {movieTitle}
          </Text>
          
          {movie.release_year && (
            <Text style={styles.itemYear}>
              {movie.release_year}
            </Text>
          )}
          
          {/* Status Button */}
          <TouchableOpacity
            style={[styles.statusButton, { borderColor: getStatusColor(item.status) }]}
            onPress={() => {
              setSelectedItem({ ...item, movieId });
              setShowStatusModal(true);
            }}
            activeOpacity={0.6}
          >
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={getStatusColor(item.status)} />
          </TouchableOpacity>

          {/* User Rating Display */}
          {item.user_rating && item.user_rating > 0 && (
            <View style={styles.userRatingContainer}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= item.user_rating ? "star" : "star-outline"}
                    size={16}
                    color={colors.warning}
                  />
                ))}
              </View>
              <Text style={[styles.ratingLabel, { color: colors.warning }]}>
                {item.user_rating}/5
              </Text>
            </View>
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

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
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
        {!selectionMode && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('EditPlaylist', {
              playlistId: playlistId,
              playlistTitle: playlist?.title || playlistTitle,
              playlistDescription: playlist?.description || ''
            })}
            activeOpacity={0.6}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
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

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your playlist is empty
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start adding movies and series!
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Browse TrackR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
          
          {/* Bulk Delete Button */}
          {selectionMode && selectedItems.length > 0 && (
            <View style={styles.bulkActionContainer}>
              <TouchableOpacity 
                style={[styles.bulkDeleteButton, { backgroundColor: colors.error }]}
                onPress={handleBulkDelete}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.bulkDeleteText}>
                  Delete {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Update Status
            </Text>
            
            {['to_watch', 'watching', 'watched'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.modalOption,
                  { 
                    backgroundColor: selectedItem?.status === status ? colors.primary + '20' : 'transparent',
                    borderBottomColor: colors.border 
                  }
                ]}
                onPress={() => handleUpdateStatus(selectedItem?.movieId, status)}
                activeOpacity={0.6}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {getStatusText(status)}
                  </Text>
                </View>
                {selectedItem?.status === status && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.border }]}
              onPress={() => setShowStatusModal(false)}
              activeOpacity={0.6}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        visible={showBulkDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBulkDeleteModal(false)}
      >
        <View style={styles.bulkDeleteModalOverlay}>
          <View style={[styles.modalContent, styles.bulkDeleteModalContent]}>
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
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={confirmBulkDelete}
              >
                <Text style={[styles.modalButtonTextDelete, { color: '#FFFFFF' }]}>Delete</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
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
    maxWidth: 320,
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bulkDeleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
