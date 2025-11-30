// src/screens/SearchResultsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchResultsScreen = ({ route, navigation }) => {
  const { results, query } = route.params;

  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => navigation.navigate('MovieDetail', { 
        movie: item,
        tmdbId: item.id 
      })}
    >
      <View style={styles.posterContainer}>
        {item.poster_path ? (
          <Text style={styles.posterPlaceholder}>🖼️</Text>
        ) : (
          <Text style={styles.posterPlaceholder}>
            {item.media_type === 'movie' ? '🎬' : '📺'}
          </Text>
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>
          {item.title || item.name}
        </Text>
        <Text style={styles.resultDetails}>
          {item.media_type === 'movie' ? 'Movie' : 'TV Show'} • 
          {item.release_date ? new Date(item.release_date).getFullYear() : 
           item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A'}
        </Text>
        <Text style={styles.resultOverview} numberOfLines={2}>
          {item.overview}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFC700" />
          <Text style={styles.rating}>
            {(item.vote_average / 2).toFixed(1)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.resultsTitle}>
          Search Results for "{query}"
        </Text>
        <Text style={styles.resultsCount}>
          {results.length} results found
        </Text>
      </View>
      
      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={item => `${item.id}-${item.media_type}`}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141517',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: '#7B7C7D',
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
  },
  posterContainer: {
    width: 60,
    height: 90,
    backgroundColor: '#1A1B1D',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  posterPlaceholder: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#7B7C7D',
    marginBottom: 6,
  },
  resultOverview: {
    fontSize: 12,
    color: '#7B7C7D',
    lineHeight: 16,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#FFC700',
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default SearchResultsScreen;