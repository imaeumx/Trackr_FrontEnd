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

const PlaylistDetailScreen = ({ route, navigation }) => {
  const { playlistId, playlistTitle } = route.params;
  const [playlist, setPlaylist] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [movieToRemove, setMovieToRemove] = useState(null);
  
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlistId]);

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
      
      Alert.alert('Success', 'Status updated successfully');
      setShowStatusModal(false);
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

  const handleMoviePress = (item) => {
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
    
    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => handleMoviePress(item)}
        activeOpacity={0.7}
      >
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
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMovie(movieId, movieTitle)}
          activeOpacity={0.6}
        >
          <Ionicons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
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
            {playlistTitle || playlist?.title}
          </Text>
          <Text style={styles.itemCount}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="film-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No movies in this playlist
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add movies from the movie detail page
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Browse Movies</Text>
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
};

export default PlaylistDetailScreen;
