// src/screens/SearchResultsScreen.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const SearchResultsScreen = ({ route, navigation }) => {
  const { results, query } = route.params;

  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => navigation.navigate('MovieDetail', { 
        movieId: item.id,
        mediaType: item.media_type === 'movie' ? 'movie' : 'tv',
        tmdbId: item.id,
        movie: {
          id: item.id,
          title: item.title || item.name,
          type: item.media_type === 'movie' ? 'movie' : 'series',
          rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A',
          year: item.release_date ? new Date(item.release_date).getFullYear() : item.first_air_date ? new Date(item.first_air_date).getFullYear() : 'N/A',
          poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          description: item.overview
        }
      })}
    >
      <View style={styles.posterContainer}>
        {item.poster_path ? (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }}
            style={styles.posterImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderText}>
              {item.media_type === 'movie' ? '🎬' : '📺'}
            </Text>
          </View>
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
          <Ionicons name="star" size={14} color={colors.warning} />
          <Text style={styles.rating}>
            {item.vote_average ? (item.vote_average / 2).toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
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

const styles = {
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  posterContainer: {
    width: 60,
    height: 90,
    borderRadius: 8,
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
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: {
    fontSize: 24,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  resultOverview: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 4,
    fontWeight: '600',
  },
};

export default SearchResultsScreen;
