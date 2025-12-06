// src/screens/MyListsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import { playlistService } from '../services/playlistService';

const MyListsScreen = ({ navigation }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const statusOrder = ['To Watch', 'Watching', 'Watched'];
  const statusOrderLower = statusOrder.map(t => t.toLowerCase());

  const getFilteredLists = () => {
    if (!searchQuery.trim()) {
      return lists;
    }
    return lists.filter(list => 
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const sortPlaylists = (arr) => {
    const normalizeTitle = (t = '') => t.trim().toLowerCase();
    console.log('📋 sortPlaylists called with', arr.length, 'items');
    
    const sorted = [...arr].sort((a, b) => {
      const aTitleNorm = normalizeTitle(a.title);
      const bTitleNorm = normalizeTitle(b.title);
      
      // Find indices in statusOrderLower
      const aStatusIdx = statusOrderLower.indexOf(aTitleNorm);
      const bStatusIdx = statusOrderLower.indexOf(bTitleNorm);
      
      const aIsStatus = aStatusIdx !== -1;
      const bIsStatus = bStatusIdx !== -1;

      // Status playlists ALWAYS come first, pinned at their exact position
      if (aIsStatus && !bIsStatus) return -1;
      if (!aIsStatus && bIsStatus) return 1;

      // If both are status playlists, order by their position in statusOrder
      if (aIsStatus && bIsStatus) {
        return aStatusIdx - bStatusIdx;
      }

      // Both are user lists: sort by most recently updated
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      if (bTime !== aTime) return bTime - aTime;
      
      // Tie-breaker: alphabetical by title
      return aTitleNorm.localeCompare(bTitleNorm);
    });

    console.log('📋 sortPlaylists OUTPUT:', sorted.map(p => p.title));
    return sorted;
  };

  const loadLists = async () => {
    try {
      setLoading(true);
      console.log('📋 loadLists START');
      const resp = await playlistService.getPlaylists();
      console.log('📋 Got response:', resp);
      const arr = Array.isArray(resp) ? resp : resp.results || [];
      console.log('📋 Extracted array, length:', arr.length);
      console.log('📋 Array items:', arr.map(p => p.title));
      const sorted = sortPlaylists(arr);
      console.log('📋 Sorted result:', sorted.map(p => p.title));
      setLists(sorted);
      console.log('📋 loadLists END - setLists called');
    } catch (error) {
      console.error('Failed to load lists:', error);
      Alert.alert('Error', 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  const handleListPress = (list) => {
    console.log('handleListPress called:', { listId: list.id, selectionMode });
    if (selectionMode) {
      toggleListSelection(list.id);
    } else {
      navigation.navigate('PlaylistDetail', {
        playlistId: list.id,
        playlistTitle: list.title
      });
    }
  };

  const toggleListSelection = (listId) => {
    console.log('toggleListSelection called:', listId);
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter(id => id !== listId));
    } else {
      setSelectedLists([...selectedLists, listId]);
    }
  };

  const handleBulkDelete = () => {
    const count = selectedLists.length;
    Alert.alert(
      'Delete Lists',
      `Are you sure you want to delete ${count} ${count === 1 ? 'list' : 'lists'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Perform bulk delete
            Alert.alert('Success', `${count} ${count === 1 ? 'list' : 'lists'} deleted successfully`);
            setSelectedLists([]);
            setSelectionMode(false);
          }
        }
      ]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedLists([]);
  };

  const selectAll = () => {
    if (selectedLists.length === lists.length) {
      setSelectedLists([]);
    } else {
      setSelectedLists(lists.map(list => list.id));
    }
  };

  const renderList = ({ item }) => {
    const isSelected = selectedLists.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.listItem,
          isSelected && { backgroundColor: colors.primary + '10', borderLeftWidth: 4, borderLeftColor: colors.primary }
        ]}
        onPress={() => handleListPress(item)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleListSelection(item.id);
          }
        }}
      >
        {selectionMode && (
          <View style={styles.checkbox}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              paddingLeft={5}
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </View>
        )}
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.title}</Text>
          <Text style={styles.listDescription}>{item.description}</Text>
          <Text style={styles.listCount}>{item.movie_count || 0} items</Text>
        </View>
        {!selectionMode && (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={globalStyles.logo}>TrackR</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={toggleSelectionMode}>
            <Ionicons 
              name={selectionMode ? "close-circle" : "checkmark-circle-outline"} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>
            {selectionMode ? `${selectedLists.length} Selected` : 'My Lists'}
          </Text>
          {selectionMode && lists.length > 0 && (
            <TouchableOpacity onPress={selectAll}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                {selectedLists.length === lists.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search playlists..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {getFilteredLists().length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{searchQuery ? 'No playlists found' : 'No lists yet'}</Text>
            <Text style={styles.emptySubtext}>{searchQuery ? 'Try a different search' : 'Create your first list to get started'}</Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredLists()}
            renderItem={renderList}
            keyExtractor={item => item.id.toString()}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateList')}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
            <Text style={styles.createButtonText}>Create New List</Text>
          </TouchableOpacity>
          {selectionMode && selectedLists.length > 0 && (
            <TouchableOpacity 
              style={[styles.deleteButton]}
              onPress={handleBulkDelete}
            >
              <Ionicons name="trash" size={24} color="#FFFFFF" />
              <Text style={[styles.deleteButtonText]}>
                Delete {selectedLists.length}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 12,
    paddingLeft: 5,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: colors.text,
  },
  listDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  listCount: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginTop: 16,
    flex: 1,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
});

export default MyListsScreen;
