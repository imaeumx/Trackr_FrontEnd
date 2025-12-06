// src/screens/EditPlaylistScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import { playlistService } from '../services/playlistService';
import Toast from '../components/Toast';

const EditPlaylistScreen = ({ route, navigation }) => {
  const { playlistId, playlistTitle: initialTitle, playlistDescription: initialDescription, isStatusPlaylist } = route?.params || {};
  
  const [listName, setListName] = useState(initialTitle || '');
  const [listDescription, setListDescription] = useState(initialDescription || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSystemPlaylist, setIsSystemPlaylist] = useState(isStatusPlaylist || false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const descriptionRef = React.useRef();

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    // Prevent editing if it's a system playlist from params
    if (isStatusPlaylist) {
      showToast('System playlists cannot be edited', 'error');
      setTimeout(() => navigation.goBack(), 1000);
      return;
    }
    
    if (playlistId && !initialTitle) {
      loadPlaylistDetails();
    }
  }, [playlistId]);

  const loadPlaylistDetails = async () => {
    try {
      setLoading(true);
      const playlist = await playlistService.getPlaylist(playlistId);
      
      // If system playlist, go back immediately
      if (playlist.is_status_playlist) {
        showToast('System playlists cannot be edited', 'error');
        setTimeout(() => navigation.goBack(), 1000);
        return;
      }
      
      setListName(playlist.title || '');
      setListDescription(playlist.description || '');
      setIsSystemPlaylist(playlist.is_status_playlist || false);
    } catch (error) {
      console.error('Error loading playlist:', error);
      Alert.alert('Error', 'Failed to load playlist details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!listName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      setSaving(true);
      await playlistService.updatePlaylist(playlistId, {
        title: listName.trim(),
        description: listDescription.trim()
      });

      showToast('Playlist updated successfully!', 'success');
      setTimeout(() => {
        navigation.navigate('PlaylistDetail', {
          playlistId,
          playlistTitle: listName.trim(),
          playlistDescription: listDescription.trim(),
          reload: true
        });
      }, 1000);
    } catch (error) {
      console.error('Error updating playlist:', error);
      showToast(error.formattedMessage || 'Failed to update playlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Playlist</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Playlist Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter playlist name"
            placeholderTextColor={colors.textSecondary}
            value={listName}
            onChangeText={setListName}
            editable={!saving}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter playlist description"
            placeholderTextColor={colors.textSecondary}
            value={listDescription}
            onChangeText={setListDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!saving}
          />

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={colors.background} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  formContainer: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
};

export default EditPlaylistScreen;
