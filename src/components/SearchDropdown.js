import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/globalStyles';

const SearchDropdown = ({ 
  results, 
  loading, 
  query, 
  onResultPress, 
  onClose,
  isVisible 
}) => {
  if (!isVisible || !query.trim()) {
    return null;
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => onResultPress(item)}
    >
      <View style={styles.resultContent}>
        {item.poster_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w92${item.poster_path}` }}
            style={styles.poster}
          />
        ) : (
          <View style={[styles.poster, styles.posterPlaceholder]}>
            <Ionicons
              name={item.media_type === 'movie' || item.title ? 'film' : 'tv'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        )}

        <View style={styles.textContent}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title || item.name}
          </Text>
          <Text style={styles.resultMeta}>
            {item.media_type === 'movie' || item.title ? '🎬 Movie' : '📺 TV'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.dropdownContainer}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : results && results.length > 0 ? (
        <FlatList
          data={results.slice(0, 8)} // Limit to 8 results
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}-${item.media_type}`}
          scrollEnabled={true}
          style={styles.list}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  list: {
    maxHeight: 400,
  },
  resultItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poster: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  posterPlaceholder: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  resultMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
};

export default SearchDropdown;
