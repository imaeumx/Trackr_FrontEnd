// src/screens/MyListsScreen.js
import React from 'react';
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
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={globalStyles.logo}>TrackR</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>My Lists</Text>
        
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
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateList')}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.createButtonText}>Create New List</Text>
        </TouchableOpacity>
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
  },
  createButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
};

export default MyListsScreen;
