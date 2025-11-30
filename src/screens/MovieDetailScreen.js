import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MovieDetailScreen = ({ route, navigation }) => {
  const { movie } = route.params;
  const [userRating, setUserRating] = useState(0);
  const [watchStatus, setWatchStatus] = useState('');

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
              color="#FFC700"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
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
            <Ionicons name="star" size={16} color="#FFC700" />
            <Text style={styles.infoValue}> {movie.rating}/5</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141517',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#1A1B1D',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#F5F5F5',
  },
  type: {
    fontSize: 16,
    color: '#7B7C7D',
    fontWeight: '500',
  },
  actions: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
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
    borderColor: '#00D084',
  },
  statusActive: {
    backgroundColor: '#00D084',
  },
  statusButtonText: {
    color: '#00D084',
    fontWeight: '500',
  },
  statusActiveText: {
    color: '#141517',
  },
  addButton: {
    backgroundColor: '#00D084',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#141517',
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
    color: '#F5F5F5',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#7B7C7D',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F5F5F5',
  },
  infoValue: {
    fontSize: 16,
    color: '#7B7C7D',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default MovieDetailScreen;