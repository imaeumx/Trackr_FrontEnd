// src/screens/ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { globalStyles, colors } from '../styles/globalStyles';
import CustomScrollView from '../components/CustomScrollView';

const ProfileScreen = ({ navigation }) => {
  const { currentUser, isLoggedIn, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (err) {
              console.error('Sign out error:', err);
            }

            // Reset navigation stack to Home after sign out
            try {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } catch (e) {
              // fallback
              navigation.navigate('Home');
            }

            Alert.alert('Signed Out', 'You have been successfully signed out.');
          }
        }
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <View style={globalStyles.container}>
        <View style={styles.header}>
          <Text style={globalStyles.logo}>TrackR</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Sign In')}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Ionicons name="person-circle-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.notLoggedInTitle}>Not Signed In</Text>
          <Text style={styles.notLoggedInText}>
            Please sign in to view your profile
          </Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => navigation.navigate('Sign In')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={globalStyles.logo}>TrackR</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <CustomScrollView
        style={globalStyles.scrollView}
        contentContainerStyle={globalStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person-circle" size={80} color={colors.primary} />
          </View>
          <Text style={styles.username}>{currentUser?.username}</Text>
          <Text style={styles.userId}>User ID: {currentUser?.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="list" size={24} color={colors.primary} />
            <Text style={styles.menuText}>My Lists</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Favorites</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Watch History</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="moon" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </CustomScrollView>
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
  signInText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
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
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
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
  menuText: {
    flex: 1,
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
};

export default ProfileScreen;