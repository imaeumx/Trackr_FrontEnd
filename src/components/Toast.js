// src/components/Toast.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../styles/globalStyles';

const Toast = ({ visible, message, type = 'success', onHide }) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'error' ? colors.error : colors.primary;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, opacity: fadeAnim },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    padding: 16,
    borderRadius: 8,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Toast;
