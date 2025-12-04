// src/screens/MyListsScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const MyListsScreen = ({ navigation }) => {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLists, setSelectedLists] = useState([]);
  
  // Mock data for lists
  const lists = [
    { id: 1, name: 'Favorite Movies', description: 'My all-time favorites', count: 12 },
    { id: 2, name: 'To Watch', description: 'Movies and shows to watch', count: 8 },
    { id: 3, name: 'Sci-Fi Collection', description: 'Best sci-fi content', count: 15 },
    { id: 4, name: 'Marvel Universe', description: 'All MCU movies', count: 25 },
  ];

  const handleListPress = (list) => {
    console.log('handleListPress called:', { listId: list.id, selectionMode });
    if (selectionMode) {
      toggleListSelection(list.id);
    } else {
      navigation.navigate('PlaylistDetail', {
        playlistId: list.id,
        playlistTitle: list.name
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
              color={isSelected ? colors.primary : colors.textSecondary} 
            />
          </View>
        )}
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listDescription}>{item.description}</Text>
          <Text style={styles.listCount}>{item.count} items</Text>
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
        
        {lists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No lists yet</Text>
            <Text style={styles.emptySubtext}>Create your first list to get started</Text>
          </View>
        ) : (
          <FlatList
            data={lists}
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

const styles = {
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
};

export default MyListsScreen;
