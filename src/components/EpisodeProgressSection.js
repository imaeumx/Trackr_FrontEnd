import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { episodeProgressService } from '../services/episodeProgressService';
import { movieService } from '../services/movieService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const EpisodeProgressSection = ({ seriesId, mediaType = 'tv', styles }) => {
  const { user, isLoggedIn } = useAuth();
  const showToast = useToast();
  const [progressHistory, setProgressHistory] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [backendMovieId, setBackendMovieId] = useState(null);

  // Fetch user's episode progress for this series
  useEffect(() => {
    if (!isLoggedIn || !seriesId) return;
    setLoading(true);
    // Always get backend Movie PK first
    setLoading(true);
    movieService.getOrCreateMovie(seriesId, mediaType)
      .then(createdMovie => {
        setBackendMovieId(createdMovie.id);
        return episodeProgressService.getProgress({ seriesId: createdMovie.id });
      })
      .then(list => {
        const sorted = [...list].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setProgressHistory(sorted);
        if (sorted.length > 0) {
          setSeason(sorted[0].season);
          setEpisode(sorted[0].episode);
          setNotes(sorted[0].notes || '');
          setRating(Number(sorted[0].rating) || 0);
        }
      })
      .catch(err => {
        showToast('Failed to load episode progress', 'error');
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, seriesId]);

  // Save episode progress
  const handleSave = async () => {
    if (saving || !isLoggedIn) return;
    setSaving(true);
    try {
      if (!backendMovieId) {
        showToast('Movie not loaded yet', 'error');
        return;
      }
      const payload = {
        series_id: backendMovieId,
        season,
        episode,
        status: 'watching',
        notes,
        rating,
      };
      if (editingId) {
        await episodeProgressService.updateProgress(editingId, payload);
        showToast('Progress updated', 'success');
      } else {
        await episodeProgressService.createProgress(payload);
        showToast('Progress saved', 'success');
      }
      // Refetch progress from backend to update display and input fields
      const list = await episodeProgressService.getProgress({ seriesId: backendMovieId });
      const sorted = [...list].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setProgressHistory(sorted);
      if (sorted.length > 0) {
        setSeason(sorted[0].season);
        setEpisode(sorted[0].episode);
        setNotes(sorted[0].notes || '');
        setRating(Number(sorted[0].rating) || 0);
      } else {
        setNotes('');
        setRating(0);
      }
      setEditingId(null);
    } catch (err) {
      showToast('Could not save progress', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Render a single progress entry
  const renderProgressItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewUsername}>Season {item.season} · Episode {item.episode}</Text>
          <View style={styles.reviewStars}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={styles.star}>{i < (item.rating || 0) ? '⭐' : '☆'}</Text>
            ))}
          </View>
          {item.updated_at && (
            <Text style={[styles.reviewDate, { fontSize: 12 }]}> 
              {new Date(item.updated_at).toLocaleDateString()} {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => {
          setEditingId(item.id);
          setSeason(item.season);
          setEpisode(item.episode);
          setNotes(item.notes || '');
          setRating(Number(item.rating) || 0);
        }} style={{ marginLeft: 8 }}>
          <Ionicons name="create-outline" size={20} color="blue" />
        </TouchableOpacity>
      </View>
      {item.notes && <Text style={styles.reviewText}>{item.notes}</Text>}
    </View>
  );
  // Group progress by season
  const groupedProgress = progressHistory.reduce((acc, entry) => {
    if (!acc[entry.season]) acc[entry.season] = [];
    acc[entry.season].push(entry);
    return acc;
  }, {});

  return (
    <View style={styles.reviewsSection}>
      <Text style={styles.sectionTitle}>My Episode Progress</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 12 }} />
      ) : (
        <>
          {Object.keys(groupedProgress).length === 0 && (
            <Text style={styles.infoLabel}>No episode progress yet.</Text>
          )}
          {Object.keys(groupedProgress).sort((a, b) => b - a).map(seasonNum => (
            <View key={seasonNum} style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>Season {seasonNum}</Text>
              {(showAll ? groupedProgress[seasonNum] : groupedProgress[seasonNum].slice(0, 5)).map(entry => renderProgressItem({ item: entry }))}
              {groupedProgress[seasonNum].length > 5 && !showAll && (
                <TouchableOpacity onPress={() => setShowAll(true)} style={{ marginTop: 8 }}>
                  <Text style={{ color: 'blue', textAlign: 'center', fontWeight: 'bold' }}>View All Episode Progress</Text>
                </TouchableOpacity>
              )}
              {showAll && (
                <TouchableOpacity onPress={() => setShowAll(false)} style={{ marginTop: 8 }}>
                  <Text style={{ color: 'blue', textAlign: 'center', fontWeight: 'bold' }}>Show Less</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {/* Input for new progress */}
          <View style={styles.progressInputsRow}>
            <TextInput
              value={season.toString()}
              onChangeText={v => setSeason(Number(v) || 1)}
              placeholder="Season"
              style={styles.progressInput}
              keyboardType="numeric"
            />
            <TextInput
              value={episode.toString()}
              onChangeText={v => setEpisode(Number(v) || 1)}
              placeholder="Episode"
              style={styles.progressInput}
              keyboardType="numeric"
            />
          </View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add your thoughts about this episode"
            style={styles.progressNotes}
            multiline
          />
          <View style={styles.progressStarsRow}>
            {[1,2,3,4,5].map(star => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Text style={styles.star}>{star <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.saveProgressButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" /> : <Text style={styles.saveProgressText}>{editingId ? 'Update Progress' : 'Save Progress'}</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default EpisodeProgressSection;
