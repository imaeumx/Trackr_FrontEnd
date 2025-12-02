// src/screens/MovieDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';
import { movieService } from '../services/movieService';

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie: movieParam, movieId, mediaType, tmdbId } = route.params || {};
  const [movie, setMovie] = useState(movieParam || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [watchStatus, setWatchStatus] = useState('');

  useEffect(() => {
    const loadIfNeeded = async () => {
      if (movie) return; // already have movie
      const tmdb = tmdbId || movieId;
      if (!tmdb) {
        setError('No movie information provided');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Decide whether to fetch TV or movie details
        if (mediaType === 'tv' || mediaType === 'series') {
          const tv = await movieService.getTVDetails(tmdb);
          setMovie({
            id: tv.id,
            title: tv.name || tv.title,
            type: 'series',
            rating: tv.vote_average ? (tv.vote_average / 2).toFixed(1) : 'N/A',
            year: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A',
            overview: tv.overview,
          });
        } else {
          const m = await movieService.getMovieDetails(tmdb);
          setMovie({
            id: m.id,
            title: m.title || m.name,
            type: 'movie',
            rating: m.vote_average ? (m.vote_average / 2).toFixed(1) : 'N/A',
            year: m.release_date ? new Date(m.release_date).getFullYear() : 'N/A',
            overview: m.overview,
          });
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError('Failed to load movie details.');
      } finally {
        setLoading(false);
      }
    };

    loadIfNeeded();
  }, [movie, movieId, mediaType, tmdbId]);

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={globalStyles.container}>
        <Text style={globalStyles.errorText}>No movie data available.</Text>
      </View>
    );
  }

  const handleAddToList = () => {
    Alert.alert('Add to List', 'Select a list to add this movie to');
  };

  const handleRate = (rating) => {
    setUserRating(rating);
    Alert.alert('Rating Added', `You rated this ${rating} stars`);
  };

  const handleSetStatus = (status) => {
    setWatchStatus(status);
    Alert.alert('Status Updated', `Marked as ${status}`);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => handleRate(star)}>
            <Ionicons
              name={star <= userRating ? "star" : "star-outline"}
              size={32}
              color={colors.warning}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={globalStyles.container}>
      <CustomScrollView style={{ flex: 1 }} contentContainerStyle={{ minHeight: Dimensions.get('window').height - 120 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.type}>{movie.type.toUpperCase()}</Text>
        </View>

        <View style={styles.actions}>
          {renderStars()}
          
          <View style={styles.statusButtons}>
            <TouchableOpacity 
              style={[styles.statusButton, watchStatus === 'Watched' && styles.statusActive]}
              onPress={() => handleSetStatus('Watched')}
            >
              <Text style={[styles.statusButtonText, watchStatus === 'Watched' && styles.statusActiveText]}>
                Watched
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statusButton, watchStatus === 'Watching' && styles.statusActive]}
              onPress={() => handleSetStatus('Watching')}
            >
              <Text style={[styles.statusButtonText, watchStatus === 'Watching' && styles.statusActiveText]}>
                Watching
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statusButton, watchStatus === 'To Watch' && styles.statusActive]}
              onPress={() => handleSetStatus('To Watch')}
            >
              <Text style={[styles.statusButtonText, watchStatus === 'To Watch' && styles.statusActiveText]}>
                To Watch
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddToList}>
            <Text style={styles.addButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Text style={styles.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{movie.type}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Community Rating:</Text>
            <View style={styles.ratingDisplay}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={styles.infoValue}> {movie.rating}/5</Text>
            </View>
          </View>
        </View>
      </CustomScrollView>
    </View>
  );
};

const styles = {
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.text,
  },
  type: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actions: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusActive: {
    backgroundColor: colors.primary,
  },
  statusButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  statusActiveText: {
    color: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
};

export default MovieDetailScreen;