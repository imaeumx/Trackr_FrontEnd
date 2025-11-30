// src/screens/PlaylistScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { playlistService } from '../services/playlistService';
import { authService } from '../services/auth';

const PlaylistScreen = ({ navigation }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadPlaylists();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.validateToken();
      const user = authService.getCurrentUser();
      
      console.log('Auth status check - Authenticated:', authenticated, 'User:', user);
      
      setIsLoggedIn(authenticated);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadPlaylists = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load playlists from API
      const playlistsData = await playlistService.getPlaylists();
      setPlaylists(playlistsData.results || []);

    } catch (error) {
      console.error('Error loading playlists:', error);
      setError('Failed to load playlists. Please check your connection.');
      setPlaylists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    loadPlaylists();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to search playlists.');
      return;
    }
    
    // Implement search functionality for playlists
    Alert.alert('Search', `Searching for: ${searchQuery}`);
  };

  const handleProfilePress = () => {
    if (isLoggedIn) {
      Alert.alert(
        'Profile',
        `Welcome, ${currentUser?.username}!`,
        [
          { text: 'My Lists', onPress: () => navigation.navigate('MyLists') },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: () => {
              authService.signOut();
              setIsLoggedIn(false);
              setCurrentUser(null);
              setPlaylists([]);
              Alert.alert('Signed Out', 'You have been successfully signed out.');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.navigate('Sign In');
    }
  };

  const handleCreatePlaylist = () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to create playlists.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert('Create Playlist', 'Create new playlist functionality');
  };

  const handlePlaylistPress = (playlist) => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view playlists.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert(playlist.title, `Viewing playlist: ${playlist.title}`);
  };

  const renderPlaylistItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.playlistCard}
      onPress={() => handlePlaylistPress(item)}
    >
      <View style={styles.playlistIcon}>
        <Ionicons name="list" size={24} color="#00D084" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistTitle}>{item.title}</Text>
        <Text style={styles.playlistDescription}>
          {item.description || 'No description'}
        </Text>
        <Text style={styles.playlistStats}>
          {item.item_count || 0} items
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#7B7C7D" />
    </TouchableOpacity>
  );

  const renderCreatePlaylistCard = () => (
    <TouchableOpacity 
      style={styles.createPlaylistCard}
      onPress={handleCreatePlaylist}
    >
      <View style={styles.createPlaylistIcon}>
        <Ionicons name="add-circle" size={32} color="#00D084" />
      </View>
      <Text style={styles.createPlaylistText}>Create New Playlist</Text>
    </TouchableOpacity>
  );

  const renderSignInPrompt = () => (
    <View style={styles.signInContainer}>
      <Ionicons name="lock-closed" size={64} color="#7B7C7D" />
      <Text style={styles.signInTitle}>Sign In Required</Text>
      <Text style={styles.signInText}>
        Please sign in to access your playlists and create new ones.
      </Text>
      <TouchableOpacity 
        style={styles.signInButton}
        onPress={() => navigation.navigate('Sign In')}
      >
        <Text style={styles.signInButtonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.guestButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.guestButtonText}>Continue Browsing</Text>
      </TouchableOpacity>
    </View>
  );

  if (!authChecked || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00D084" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fixed Header - Same as HomeScreen */}
      <View style={styles.header}>
        <Text style={styles.logo}>TrackR</Text>
        
        {/* Menu and Search combined on the right side */}
        <View style={styles.rightContainer}>

          {/* Search next to menu */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={isLoggedIn ? "Search playlists..." : "Sign in to search..."}
              placeholderTextColor="#7B7C7D"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={isLoggedIn}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search" size={16} color="#7B7C7D" />
            </TouchableOpacity>
          </View>
          
          {/* Menu items - Home Films Series Playlist */}
          <View style={styles.menuContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Films')}>
              <Text style={styles.menuText}>Films</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Series')}>
              <Text style={styles.menuText}>Series</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
              <Text style={[styles.menuText, styles.activeMenuText]}>Playlist</Text>
            </TouchableOpacity>
          </View>

          {/* Profile / Sign In - FIXED ALIGNMENT */}
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <View style={styles.profileContainer}>
              {isLoggedIn ? (
                <>
                  <Ionicons name="person-circle" size={20} color="#00D084" />
                  <Text style={styles.usernameText}>
                    {currentUser?.username}
                  </Text>
                </>
              ) : (
                <Text style={styles.signInText}>Sign In</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00D084']}
            tintColor="#00D084"
            enabled={isLoggedIn}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {!isLoggedIn ? (
          // Show sign in prompt for non-authenticated users
          renderSignInPrompt()
        ) : (
          // Show playlists for authenticated users
          <>
            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={20} color="#E53935" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Welcome Message */}
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Welcome back, {currentUser?.username}! 👋
              </Text>
              <Text style={styles.welcomeSubtext}>
                Manage your movie and series playlists
              </Text>
            </View>

            {/* Create Playlist Card */}
            {renderCreatePlaylistCard()}

            {/* Playlists List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Playlists ({playlists.length})</Text>
              {playlists.length > 0 ? (
                <FlatList
                  data={playlists}
                  renderItem={renderPlaylistItem}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="list" size={48} color="#7B7C7D" />
                  <Text style={styles.emptyTitle}>No playlists yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create your first playlist to organize your movies and series
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Extra space to ensure scrolling works */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141517',
  },
  // Header Styles (Fixed alignment)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#1A1B1D',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2D',
  },
  logo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#00D084',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    marginLeft: 20,
    fontSize: 14,
    fontWeight: '500',
    color: '#F5F5F5',
  },
  activeMenuText: {
    color: '#00D084',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 160,
    marginRight: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#141517',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2B2D',
    paddingLeft: 36,
    color: '#F5F5F5',
    fontSize: 12,
    height: 32,
  },
  searchButton: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  profileButton: {
    paddingHorizontal: 8,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  usernameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D084',
    marginLeft: 6,
  },
  signInText: {
    fontSize: 14, // Fixed font size to match other menu items
    fontWeight: '500',
    color: '#F5F5F5',
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141517',
  },
  loadingText: {
    color: '#7B7C7D',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1B1D',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E53935',
  },
  errorText: {
    color: '#F5F5F5',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  welcomeContainer: {
    backgroundColor: '#1A1B1D',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00D084',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#7B7C7D',
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    color: '#F5F5F5',
  },
  createPlaylistCard: {
    backgroundColor: '#1A1B1D',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2B2D',
    borderStyle: 'dashed',
  },
  createPlaylistIcon: {
    marginBottom: 8,
  },
  createPlaylistText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D084',
  },
  playlistCard: {
    backgroundColor: '#1A1B1D',
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistIcon: {
    marginRight: 12,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F5F5F5',
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: '#7B7C7D',
    marginBottom: 4,
  },
  playlistStats: {
    fontSize: 12,
    color: '#00D084',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F5F5F5',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7B7C7D',
    textAlign: 'center',
    lineHeight: 20,
  },
  signInContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5F5F5',
    marginTop: 24,
    marginBottom: 12,
  },
  signInText: {
    fontSize: 16,
    color: '#7B7C7D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: '#00D084',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#141517',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 12,
  },
  guestButtonText: {
    color: '#7B7C7D',
    fontSize: 14,
  },
  bottomPadding: {
    height: 100,
  },
});

export default PlaylistScreen;