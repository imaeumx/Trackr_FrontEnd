// src/components/LoadingScreen.js
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { globalStyles, colors } from '../styles/globalStyles';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <View style={[globalStyles.container, { 
      justifyContent: 'center', 
      alignItems: 'center' 
    }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[globalStyles.loadingText, { marginTop: 16 }]}>
        {message}
      </Text>
    </View>
  );
};

export default LoadingScreen;