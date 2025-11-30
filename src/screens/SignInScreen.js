// src/screens/SignInScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { authService } from '../services/auth';

const SignInScreen = ({ navigation }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Sign In State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Sign Up State
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const handleSignIn = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting sign in process...');
      const result = await authService.signIn({ username, password });
      console.log('Sign in result:', result);
      
      // UPDATED: Redirect to Playlist screen after successful login
      Alert.alert('Success', `Welcome back to TrackR, ${username}!`);
      navigation.replace('Playlist');
    } catch (error) {
      console.error('Sign in failed:', error);
      Alert.alert('Login Failed', 
        typeof error === 'string' ? error : 
        error.error || error.detail || 'Invalid credentials or server error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpUsername || !signUpEmail || !signUpPassword || !retypePassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (signUpPassword !== retypePassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (signUpPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting sign up process...');
      const result = await authService.signUp({
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword
      });
      console.log('Sign up result:', result);
      
      // UPDATED: Redirect to Playlist screen after successful signup
      Alert.alert('Success', `Welcome to TrackR, ${signUpUsername}!`);
      navigation.replace('Playlist');
    } catch (error) {
      console.error('Sign up failed:', error);
      Alert.alert('Registration Failed', 
        typeof error === 'string' ? error : 
        error.error || error.detail || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    Alert.alert('Continue as Guest', 'You can browse movies and series, but some features require an account.');
    navigation.goBack();
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setSignUpUsername('');
    setSignUpEmail('');
    setSignUpPassword('');
    setRetypePassword('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>TrackR</Text>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D084" />
            <Text style={styles.loadingText}>
              {isSignUp ? 'Creating account...' : 'Signing in...'}
            </Text>
          </View>
        )}
        
        {isSignUp ? (
          // SIGN UP FORM
          <>
            <Text style={styles.formLabel}>Create Account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#7B7C7D"
              value={signUpUsername}
              onChangeText={setSignUpUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#7B7C7D"
              value={signUpEmail}
              onChangeText={setSignUpEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#7B7C7D"
              value={signUpPassword}
              onChangeText={setSignUpPassword}
              secureTextEntry
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Retype Password"
              placeholderTextColor="#7B7C7D"
              value={retypePassword}
              onChangeText={setRetypePassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity 
              style={[styles.authButton, loading && styles.disabledButton]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(false);
                clearForm();
              }}
              disabled={loading}
            >
              <Text style={styles.switchButtonText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          // SIGN IN FORM
          <>
            <Text style={styles.formLabel}>Sign In</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#7B7C7D"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#7B7C7D"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity 
              style={[styles.authButton, loading && styles.disabledButton]} 
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(true);
                clearForm();
              }}
              disabled={loading}
            >
              <Text style={styles.switchButtonText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.guestSection}>
          <TouchableOpacity 
            style={styles.guestButton} 
            onPress={handleGuest}
            disabled={loading}
          >
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
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
  formContainer: {
    padding: 24,
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#00D084',
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: '#F5F5F5',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#1A1B1D',
    borderRadius: 8,
  },
  loadingText: {
    color: '#7B7C7D',
    marginTop: 10,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1A1B1D',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2B2D',
    color: '#F5F5F5',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#00D084',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#7B7C7D',
  },
  authButtonText: {
    color: '#141517',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  switchButtonText: {
    color: '#00D084',
    fontSize: 14,
    fontWeight: '500',
  },
  guestSection: {
    borderTopWidth: 1,
    borderTopColor: '#2A2B2D',
    marginTop: 16,
    paddingTop: 16,
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#7B7C7D',
    fontSize: 14,
  },
});

export default SignInScreen;