// src/screens/SignInScreen.js - UPDATED WITH BETTER ERROR HANDLING
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { authService } from '../services/auth';
import { globalStyles, colors } from '../styles/globalStyles';

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
      console.log('Attempting sign in...');
      const result = await authService.signIn({ username, password });
      console.log('Sign in successful:', result);

      // Show success alert with auto-dismiss
      Alert.alert('Success', `Welcome back to TrackR, ${username}! 🎉`);

      // Navigate after a short delay to let user see the success message
      setTimeout(() => {
        navigation.replace('Playlist');
      }, 1500);

    } catch (error) {
      console.error('Sign in error details:', error);

      let errorTitle = 'Login Failed';
      let errorMessage = '';
      let buttons = [{ text: 'OK' }];

      // Parse the error to get meaningful messages
      if (error.response?.status === 404) {
        errorTitle = 'User Not Found';
        errorMessage = `The username "${username}" doesn't exist.\n\nWould you like to create an account?`;
        buttons = [
          {
            text: 'Create Account',
            onPress: () => {
              setIsSignUp(true);
              setSignUpUsername(username);
              setPassword('');
            }
          },
          { text: 'Try Again', style: 'cancel' }
        ];
      } else if (error.response?.status === 401) {
        errorTitle = 'Wrong Password';
        errorMessage = 'The password you entered is incorrect.';
        buttons = [
          {
            text: 'Try Again',
            onPress: () => {
              setPassword('');
            }
          },
          {
            text: 'Forgot Password?',
            style: 'destructive',
            onPress: () => {
              Alert.alert('Forgot Password', 'Please contact support to reset your password.');
            }
          }
        ];
      } else if (error.message === 'Network Error') {
        errorTitle = 'Connection Error';
        errorMessage = 'Cannot connect to the server.\n\nPlease check:\n• Backend is running on http://localhost:8000\n• Your internet connection\n• Try again in a moment';
      } else if (error.code === 'ECONNABORTED') {
        errorTitle = 'Timeout';
        errorMessage = 'Server is taking too long to respond.\n\nPlease check if the backend server is running.';
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.formattedMessage) {
        errorMessage = error.formattedMessage;
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }

      Alert.alert(errorTitle, errorMessage, buttons);

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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign up...');
      const result = await authService.signUp({
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword
      });
      console.log('Sign up successful:', result);

      Alert.alert('Success', `Welcome to TrackR, ${signUpUsername}!`);
      navigation.replace('Playlist');
    } catch (error) {
      console.error('Sign up error details:', error);

      let errorMessage = 'Registration failed. Please try again.';

      // Parse the error to get meaningful messages
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.formattedMessage) {
        errorMessage = error.formattedMessage;
      } else if (error.response?.data) {
        // Handle Django backend errors
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (error.response.data.username) {
          errorMessage = `Username: ${error.response.data.username[0]}`;
        } else if (error.response.data.email) {
          errorMessage = `Email: ${error.response.data.email[0]}`;
        } else if (error.response.data.password) {
          errorMessage = `Password: ${error.response.data.password[0]}`;
        }
      }

      // Special handling for network errors
      if (error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:8000';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. Server may be offline or unreachable.';
      }

      Alert.alert(
        'Registration Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              // Clear password fields for retry
              setSignUpPassword('');
              setRetypePassword('');
            }
          },
          { text: 'OK' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    Alert.alert(
      'Continue as Guest',
      'You can browse movies and series, but some features require an account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate back to home as guest
            navigation.replace('Home');
          }
        }
      ]
    );
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setSignUpUsername('');
    setSignUpEmail('');
    setSignUpPassword('');
    setRetypePassword('');
  };

  // Helper function to show input validation errors
  const showInputError = (fieldName, message) => {
    Alert.alert('Input Error', `${fieldName}: ${message}`);
  };

  return (
    <View style={globalStyles.container}>
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>TrackR</Text>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
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
                placeholderTextColor={colors.textSecondary}
                value={signUpUsername}
                onChangeText={setSignUpUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={() => {
                  if (!signUpUsername.trim()) {
                    showInputError('Username', 'Username is required');
                  }
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={signUpEmail}
                onChangeText={setSignUpEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={() => {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(signUpEmail)) {
                    showInputError('Email', 'Please enter a valid email');
                  }
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Password (min 8 characters)"
                placeholderTextColor={colors.textSecondary}
                value={signUpPassword}
                onChangeText={setSignUpPassword}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={() => {
                  if (signUpPassword.length < 8) {
                    showInputError('Password', 'Must be at least 8 characters');
                  }
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Retype Password"
                placeholderTextColor={colors.textSecondary}
                value={retypePassword}
                onChangeText={setRetypePassword}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={() => {
                  if (signUpPassword !== retypePassword) {
                    showInputError('Password', 'Passwords do not match');
                  }
                }}
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
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={() => {
                  if (!username.trim()) {
                    showInputError('Username', 'Username is required');
                  }
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                onSubmitEditing={() => {
                  if (!password) {
                    showInputError('Password', 'Password is required');
                  }
                }}
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
    </View>
  );
};

const styles = {
  formContainer: {
    padding: 24,
    marginTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.primary,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 10,
    fontSize: 14,
  },
  input: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
  },
  authButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
  },
  authButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  switchButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  guestSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 16,
    paddingTop: 16,
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
};

export default SignInScreen;