// src/screens/MyListsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyListsScreen = ({ navigation }) => {
  // Mock data for lists
  const lists = [
    { id: 1, name: 'Favorite Movies', description: 'My all-time favorites', count: 12 },
    { id: 2, name: 'To Watch', description: 'Movies and shows to watch', count: 8 },
    { id: 3, name: 'Sci-Fi Collection', description: 'Best sci-fi content', count: 15 },
    { id: 4, name: 'Marvel Universe', description: 'All MCU movies', count: 25 },
  ];

  const handleListPress = (list) => {
    Alert.alert(list.name, `Viewing ${list.count} items in this list`);
  };

  const handleDeleteList = (list) => {
    Alert.alert('Delete List', `Are you sure you want to delete "${list.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive' }
    ]);
  };

  const renderList = ({ item }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => handleListPress(item)}
    >
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listDescription}>{item.description}</Text>
        <Text style={styles.listCount}>{item.count} items</Text>
      </View>
      <View style={styles.listActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteList(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Lists</Text>
      
      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={64} color="#ccc" />
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
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateList')}
      >
        <Ionicons name="add" size={24} color="#007AFF" />
        <Text style={styles.createButtonText}>Create New List</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 12,
    color: '#007AFF',
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
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 16,
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default MyListsScreen;