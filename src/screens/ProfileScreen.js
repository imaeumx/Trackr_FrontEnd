// src/screens/ProfileScreen.js - UPDATED (Removed My Lists)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';

const ProfileScreen = ({ navigation }) => {
  const { currentUser, isLoggedIn, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = async () => {
    console.log('ProfileScreen: handleSignOut triggered');
    // On web, use modal instead of Alert for better reliability
    if (Platform.OS === 'web') {
      setShowSignOutModal(true);
    } else {
      // On native, use traditional Alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              await confirmSignOut();
            }
          }
        ]
      );
    }
  };

  const confirmSignOut = async () => {
    try {
      console.log('ProfileScreen: User confirmed sign out');
      setShowSignOutModal(false);
      
      // Sign out
      await signOut();
      console.log('ProfileScreen: Sign out complete, navigating to Home');
      
      // Reset navigation after a small delay to ensure state is updated
      setTimeout(() => {
        console.log('ProfileScreen: Resetting navigation to Home');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      }, 200);
    } catch (err) {
      console.error('ProfileScreen: Sign out error:', err);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleFavorites = () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view favorites.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert('Favorites', 
      'Favorites feature coming soon!\n\n' +
      'This will allow you to mark movies and series as favorites for quick access.'
    );
  };

  const handleWatchHistory = () => {
    if (!isLoggedIn) {
      Alert.alert('Sign In Required', 'Please sign in to view watch history.');
      navigation.navigate('Sign In');
      return;
    }
    Alert.alert('Watch History', 
      'Watch History feature coming soon!\n\n' +
      'This will track all the movies and series you\'ve watched.'
    );
  };

  const handleHelpSupport = () => {
    navigation.navigate('HelpSupport');
  };

  if (!isLoggedIn) {
    return (
      <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[globalStyles.logo, { color: colors.primary }]}>TrackR</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.notLoggedInTitle, { color: colors.text }]}>Not Signed In</Text>
          <Text style={[styles.notLoggedInText, { color: colors.textSecondary }]}>
            Please sign in to access your profile and lists
          </Text>
          <TouchableOpacity 
            style={[styles.signInButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Sign In')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.guestButton, { borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.guestButtonText, { color: colors.text }]}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[globalStyles.logo, { color: colors.primary }]}>TrackR</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CustomScrollView
        style={[globalStyles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={globalStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.username, { color: colors.text }]}>{currentUser?.username}</Text>
          <Text style={[styles.userId, { color: colors.textSecondary }]}>User ID: {currentUser?.id}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{currentUser?.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tracking</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]} onPress={handleFavorites}>
            <Ionicons name="heart" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Favorites</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]} onPress={handleWatchHistory}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Watch History</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border, backgroundColor: colors.card }]} onPress={handleHelpSupport}>
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: colors.card }]} onPress={handleSignOut}>
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>TrackR v1.0.0</Text>
          <Text style={[styles.copyright, { color: colors.textSecondary }]}>© 2024 TrackR. All rights reserved.</Text>
        </View>
      </CustomScrollView>

      {/* Sign Out Confirmation Modal (Web-friendly) */}
      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>Are you sure you want to sign out?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.error }]}
                onPress={confirmSignOut}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  notLoggedInText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    padding: 12,
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    margin: 16,
    borderRadius: 12,
  },
  avatar: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  userId: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    marginLeft: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A1B1D',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error,
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default ProfileScreen;
