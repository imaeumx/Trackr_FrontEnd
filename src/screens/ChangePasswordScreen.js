// src/screens/ChangePasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import { authService } from '../services/auth';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from '../components/LoadingScreen';

const ChangePasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Removed showSignOutLoading state
  const { toast, showToast, hideToast } = useToast();
  const { currentUser, signOut } = useAuth();

  // Prefill email from logged-in user if available
  React.useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleHeaderBack = () => {
    // If in multi-step flow, step back first; otherwise pop screen or go to Profile
    if (step > 1) {
      setStep(prev => Math.max(1, prev - 1));
      return;
    }
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Profile');
    }
  };

  const sendCode = async () => {
    if (!currentUser?.email) {
      showToast('User email not found', 'error');
      return;
    }
    try {
      setSendingCode(true);
      await authService.requestPasswordChangeCode(currentUser.email);
      setEmail(currentUser.email);
      setCodeSent(true);
      showToast('Verification code sent to your email', 'success');
      setStep(2);
    } catch (error) {
      console.error('[ChangePassword] send code error:', error);
      const msg = error?.formattedMessage || error?.message || error?.detail || error?.toString() || 'Failed to send code';
      showToast(msg, 'error');
      Alert.alert('Error', msg);
    } finally {
      setSendingCode(false);
    }
  };

  const proceedToPasswords = () => {
    if (!code.trim() || code.trim().length < 6) {
      showToast('Enter the 6-digit code', 'error');
      return;
    }
    setStep(3);
  };

  const backOneStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const maskEmailForDisplay = (emailStr) => {
    if (!emailStr) return '';
    const [localPart, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    const maskedLocal = localPart.charAt(0) + '***';
    return `${maskedLocal}@${domain}`;
  };

  const handleSubmit = async () => {
    if (!currentUser?.email || !code.trim()) {
      showToast('Missing email or code', 'error');
      return;
    }
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast('Fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await authService.changePasswordWithCode({
        email: currentUser.email,
        code: code.trim(),
        oldPassword,
        newPassword,
        confirmPassword,
      });
      showToast('Password updated successfully', 'success');
      // No loading overlay after password change
      setTimeout(async () => {
        await signOut();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Sign In' }],
        });
      }, 2500);
    } catch (error) {
      console.error('[ChangePassword] submit error:', error);
      // No loading overlay to reset
      Alert.alert('Error', error?.message || error?.detail || error?.toString() || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading indicator until currentUser is loaded
  if (!currentUser) {
    return <LoadingScreen text="Loading user info..." />;
  }

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={handleHeaderBack} style={styles.backButton}> 
          <Ionicons name="arrow-back" size={24} color={colors.text} /> 
        </TouchableOpacity> 
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text> 
        <View style={{ width: 40 }} /> 
      </View>
      <View style={styles.content}> 
        <View style={styles.centerBox}> 
          <View style={styles.stepperRow}> 
            {[1, 2, 3].map((num) => (
              <View key={num} style={styles.stepperItem}> 
                <View style={[styles.stepCircle, step === num && styles.stepCircleActive, step > num && styles.stepCircleDone]}> 
                  <Text style={[styles.stepNumber, step >= num ? { color: colors.card } : { color: colors.textSecondary }]}>{num}</Text> 
                </View> 
                <Text style={[styles.stepLabel, step === num && styles.stepLabelActive]}> 
                  {num === 1 ? 'Email' : num === 2 ? 'Code' : 'Password'} 
                </Text> 
                {num < 3 && <View style={[styles.stepConnector, step > num && { backgroundColor: colors.primary }]} />} 
              </View> 
            ))} 
          </View>
          {step === 1 && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 16 }]}>We'll send a 6-digit code to your registered email address</Text>
              <Text style={[styles.maskedEmailText, { color: colors.primary }]}>{maskEmailForDisplay(currentUser.email)}</Text>
              <TouchableOpacity style={[styles.codeButton, { backgroundColor: colors.primary, opacity: !sendingCode ? 1 : 0.6 }]} onPress={sendCode} disabled={sendingCode || !currentUser.email}>
                {sendingCode ? <ActivityIndicator color="#fff" /> : <Text style={styles.codeButtonText}>Send Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>6-Digit Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter code"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                onSubmitEditing={() => code.trim().length === 6 && proceedToPasswords()}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={backOneStep} style={[styles.cancelButton, { backgroundColor: colors.error }]} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resendButton, { borderColor: colors.primary }]}
                  onPress={sendCode}
                  disabled={sendingCode}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.resendButtonText, { color: colors.primary }]}>{sendingCode ? 'Sending...' : 'Resend'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: colors.primary, opacity: code.trim().length === 6 ? 1 : 0.6 }]}
                  onPress={proceedToPasswords}
                  disabled={code.trim().length !== 6}
                  activeOpacity={0.85}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Old Password</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Old password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showOldPassword}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Ionicons name={showOldPassword ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="New password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons name={showNewPassword ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.step3ButtonRow}>
                <TouchableOpacity onPress={backOneStep} style={[styles.backButtonStep3, { backgroundColor: colors.error }]} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.updatePasswordButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* No loading overlay after password change */}
        </View>
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      {/* No loading overlay after password change */}
    </View>
  );
};

const styles = {
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerBox: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  centerBox: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    fontWeight: '700',
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textSecondary,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  stepConnector: {
    position: 'absolute',
    right: -18,
    top: 18,
    width: 36,
    height: 2,
    backgroundColor: colors.border,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  maskedEmailText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  codeButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.25,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    flex: 0.3,
  },
  resendButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  continueButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.3,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -20 }],
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  step3ButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  backButtonStep3: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  updatePasswordButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
};

export default ChangePasswordScreen;
