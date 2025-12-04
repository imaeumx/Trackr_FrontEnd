// src/screens/SearchResultsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';

const SearchResultsScreen = ({ route, navigation }) => {
  const { results = [], query = '' } = route.params || {};
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = React.useRef(null);

  useEffect(() => {
    console.log('SearchResultsScreen received:');
    console.log('Query:', query);
    console.log('Results count:', results?.length || 0);
    console.log('Results:', results);
  }, []);

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      <CustomScrollView
        ref={scrollViewRef}
        style={globalStyles.scrollView}
        contentContainerStyle={[
          globalStyles.scrollContent,
          { minHeight: Dimensions.get('window').height - 120 }
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setShowScrollToTop(offsetY > 300);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.resultsTitle}>
              Search Results for "{query}"
            </Text>
            <Text style={styles.resultsCount}>
              {results?.length || 0} results found
            </Text>
          </View>
        </View>
        
        {results && results.length > 0 ? (
          results.map((item, index) => (
            <TouchableOpacity 
              key={`${item.id}-${item.media_type}-${index}`}
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
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No results found for "{query}"</Text>
          </View>
        )}
      </CustomScrollView>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <Ionicons name="chevron-up" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = {
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
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
