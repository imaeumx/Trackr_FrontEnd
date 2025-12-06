// src/screens/ResetPasswordScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import { authService } from '../services/auth';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { toast, showToast, hideToast } = useToast();
  const [step, setStep] = useState(1);
  const [loginValue, setLoginValue] = useState('');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (route?.params?.initialLogin) {
      setLoginValue(route.params.initialLogin);
    }
  }, [route?.params?.initialLogin]);

  const handleHeaderBack = () => {
    if (step > 1) {
      setStep(prev => Math.max(1, prev - 1));
      return;
    }
    if (navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Sign In');
    }
  };

  const sendCode = async () => {
    const value = loginValue.trim();
    if (!value) {
      showToast('Please enter your email or username', 'error');
      return;
    }
    try {
      setSendingCode(true);
      const res = await authService.requestPasswordResetCode(value);
      if (res?.user_id) {
        setUserId(res.user_id);
      }
      setCodeSent(true);
      showToast('Reset code sent. Check your email.', 'success');
      setStep(2);
    } catch (error) {
      console.error('[ResetPassword] send code error:', error);
      const msg = error?.formattedMessage || error?.message || error?.detail || error?.toString() || 'Failed to send code';
      showToast(msg, 'error');
      Alert.alert('Error', msg);
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!userId) {
      showToast('Missing user id. Please resend code.', 'error');
      return;
    }
    if (!code.trim() || code.trim().length < 6) {
      showToast('Enter the 6-digit code', 'error');
      return;
    }
    try {
      setVerifying(true);
      await authService.verifyPasswordResetCode({ userId, code: code.trim() });
      showToast('Code verified. Set your new password.', 'success');
      setStep(3);
    } catch (error) {
      console.error('[ResetPassword] verify code error:', error);
      const msg = error?.formattedMessage || error?.message || error?.detail || error?.toString() || 'Failed to verify code';
      showToast(msg, 'error');
      Alert.alert('Error', msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      showToast('Missing user id. Please resend code.', 'error');
      return;
    }
    if (!newPassword || !confirmPassword) {
      showToast('Fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      setSubmitting(true);
      await authService.confirmPasswordReset({ userId, newPassword });
      showToast('Password reset successfully', 'success');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Sign In' }],
      });
    } catch (error) {
      console.error('[ResetPassword] submit error:', error);
      Alert.alert('Error', error?.message || error?.detail || error?.toString() || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[globalStyles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleHeaderBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reset Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.centerBox}>
          {/* Step indicator */}
          <View style={styles.stepperRow}>
            {[1, 2, 3].map((num) => (
              <View key={num} style={styles.stepperItem}>
                <View style={[styles.stepCircle, step === num && styles.stepCircleActive, step > num && styles.stepCircleDone]}>
                  <Text style={[styles.stepNumber, step >= num ? { color: colors.card } : { color: colors.textSecondary }]}>{num}</Text>
                </View>
                <Text style={[styles.stepLabel, step === num && styles.stepLabelActive]}>
                  {num === 1 ? 'Account' : num === 2 ? 'Code' : 'Password'}
                </Text>
                {num < 3 && <View style={[styles.stepConnector, step > num && { backgroundColor: colors.primary }]} />}
              </View>
            ))}
          </View>

          {step === 1 && (
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Email or Username</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 12 }]}>Enter the email or username you used for your account.</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="you@example.com or username"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                value={loginValue}
                onChangeText={setLoginValue}
                editable={!sendingCode}
              />

              <TouchableOpacity
                style={[styles.codeButton, { backgroundColor: colors.primary, opacity: !sendingCode ? 1 : 0.6 }]}
                onPress={sendCode}
                disabled={sendingCode}
                activeOpacity={0.8}
              >
                {sendingCode ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.codeButtonText}>{codeSent ? 'Resend Code' : 'Send Code'}</Text>
                )}
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
                onSubmitEditing={() => code.trim().length === 6 && verifyCode()}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => setStep(1)} style={[styles.cancelButton, { backgroundColor: colors.error }]} activeOpacity={0.8}>
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: colors.primary, opacity: code.trim().length === 6 ? 1 : 0.6 }]}
                  onPress={verifyCode}
                  disabled={code.trim().length !== 6 || verifying}
                  activeOpacity={0.85}
                >
                  {verifying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.continueButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ marginTop: 12, alignSelf: 'center' }}
                onPress={sendCode}
                disabled={sendingCode}
                activeOpacity={0.7}
              >
                <Text style={[styles.resendButtonText, { color: colors.primary }]}>
                  {sendingCode ? 'Sending...' : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View>
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
                <TouchableOpacity onPress={() => setStep(2)} style={[styles.backButtonStep3, { backgroundColor: colors.error }]} activeOpacity={0.8}>
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
                    <Text style={styles.submitButtonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

const styles = {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.45,
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
    flex: 0.45,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
};

export default ResetPasswordScreen;
