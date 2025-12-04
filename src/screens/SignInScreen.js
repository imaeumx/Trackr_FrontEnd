// src/screens/SignInScreen.js - UPDATED WITH BETTER ERROR HANDLING
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import { authService } from '../services/auth';
import { globalStyles, colors } from '../styles/globalStyles';

const SignInScreen = ({ navigation }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(null);

  // Sign In State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');

  const showError = (title, message, buttons = null) => {
    if (Platform.OS === 'web') {
      // On web, use custom modal since Alert.alert doesn't work reliably
      setErrorModal({
        title,
        message,
        buttons: buttons || [{ text: 'OK', onPress: () => setErrorModal(null) }]
      });
    } else {
      // On native, use Alert.alert
      Alert.alert(title, message, buttons || [{ text: 'OK' }]);
    }
  };

  const handleSignIn = async () => {
    if (!username || !password) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting sign in...');
      const result = await authService.signIn({ username, password });
      console.log('Sign in successful:', result);

      // Show success alert with auto-dismiss
      showError('Success', `Welcome back to TrackR, ${username}! 🎉`, [
        { text: 'OK', onPress: () => {
          setErrorModal(null);
          setTimeout(() => {
            navigation.replace('Playlist');
          }, 500);
        }}
      ]);

    } catch (error) {
      console.error('Sign in error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error status:', error.response?.status);
      console.error('Error is string?', typeof error === 'string');

      let errorTitle = 'Login Failed';
      let errorMessage = '';
      let buttons = [{ text: 'OK', onPress: () => setErrorModal(null) }];

      // Parse the error to get meaningful messages
      if (typeof error === 'string') {
        // Handle string errors thrown from auth service
        if (error.includes('does not exist') || error.includes('User does not exist')) {
          errorTitle = 'User Not Found';
          errorMessage = `The username "${username}" doesn't exist.\n\nWould you like to create an account?`;
          buttons = [
            {
              text: 'Create Account',
              onPress: () => {
                setErrorModal(null);
                setIsSignUp(true);
                setSignUpUsername(username);
                setPassword('');
              }
            },
            { text: 'Try Again', onPress: () => setErrorModal(null) }
          ];
        } else if (error.includes('Invalid') || error.includes('password')) {
          errorTitle = 'Wrong Password';
          errorMessage = 'The password you entered is incorrect.';
          buttons = [
            {
              text: 'Try Again',
              onPress: () => {
                setErrorModal(null);
                setPassword('');
              }
            },
            {
              text: 'Forgot Password?',
              onPress: () => {
                setErrorModal(null);
                showError('Forgot Password', 'Please contact support to reset your password.');
              }
            }
          ];
        } else {
          errorMessage = error;
        }
      } else if (error.response?.status === 404) {
        errorTitle = 'User Not Found';
        errorMessage = `The username "${username}" doesn't exist.\n\nWould you like to create an account?`;
        buttons = [
          {
            text: 'Create Account',
            onPress: () => {
              setErrorModal(null);
              setIsSignUp(true);
              setSignUpUsername(username);
              setPassword('');
            }
          },
          { text: 'Try Again', onPress: () => setErrorModal(null) }
        ];
      } else if (error.response?.status === 401) {
        errorTitle = 'Wrong Password';
        errorMessage = 'The password you entered is incorrect.';
        buttons = [
          {
            text: 'Try Again',
            onPress: () => {
              setErrorModal(null);
              setPassword('');
            }
          },
          {
            text: 'Forgot Password?',
            onPress: () => {
              setErrorModal(null);
              showError('Forgot Password', 'Please contact support to reset your password.');
            }
          }
        ];
      } else if (error.message === 'Network Error') {
        errorTitle = 'Connection Error';
        errorMessage = 'Cannot connect to the server.\n\nPlease check:\n• Backend is running on http://localhost:8000\n• Your internet connection\n• Try again in a moment';
      } else if (error.code === 'ECONNABORTED') {
        errorTitle = 'Timeout';
        errorMessage = 'Server is taking too long to respond.\n\nPlease check if the backend server is running.';
      } else if (error.formattedMessage) {
        errorMessage = error.formattedMessage;
      } else {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }

      console.log('Showing alert:', errorTitle, errorMessage);
      showError(errorTitle, errorMessage, buttons);

    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpUsername || !signUpEmail || !signUpPassword || !retypePassword) {
      showError('Error', 'Please fill in all fields');
      return;
    }

    if (signUpPassword !== retypePassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    if (signUpPassword.length < 8) {
      showError('Error', 'Password must be at least 8 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signUpEmail)) {
      showError('Error', 'Please enter a valid email address');
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

      showError('Success', `Welcome to TrackR, ${signUpUsername}!`, [
        { text: 'OK', onPress: () => {
          setErrorModal(null);
          setTimeout(() => {
            navigation.replace('Playlist');
          }, 500);
        }}
      ]);
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

      showError(
        'Registration Failed',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setErrorModal(null);
              // Clear password fields for retry
              setSignUpPassword('');
              setRetypePassword('');
            }
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    showError(
      'Continue as Guest',
      'You can browse movies and series, but some features require an account.',
      [
        { text: 'Cancel', onPress: () => setErrorModal(null) },
        {
          text: 'Continue',
          onPress: () => {
            setErrorModal(null);
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
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}>
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
                placeholder="Verify Password"
                placeholderTextColor={colors.textSecondary}
                value={retypePassword}
                onChangeText={setRetypePassword}
                secureTextEntry
                editable={!loading}
                returnKeyType="go"
                onSubmitEditing={handleSignUp}
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
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
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

      {/* Error Modal for Web */}
      {errorModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setErrorModal(null)}
        >
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorModalContent}>
              <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
              <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
              
              <View style={styles.errorModalButtons}>
                {errorModal.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.errorModalButton,
                      index === errorModal.buttons.length - 1 ? styles.errorModalButtonPrimary : styles.errorModalButtonSecondary
                    ]}
                    onPress={button.onPress}
                  >
                    <Text style={[
                      styles.errorModalButtonText,
                      index === errorModal.buttons.length - 1 && styles.errorModalButtonTextPrimary
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorModalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  errorModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  errorModalButtonSecondary: {
    backgroundColor: colors.border,
  },
  errorModalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  errorModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  errorModalButtonTextPrimary: {
    color: '#FFFFFF',
  },
};

export default SignInScreen;
