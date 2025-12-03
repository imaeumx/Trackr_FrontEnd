// src/components/CustomScrollView.js - UPDATED VERSION
import React, { useRef } from 'react';
import {
  ScrollView,
  Platform,
  StyleSheet,
  Dimensions,
  RefreshControl
} from 'react-native';
import { globalStyles, colors } from '../styles/globalStyles';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const CustomScrollView = ({ 
  children, 
  style, 
  contentContainerStyle, 
  refreshing = false,
  onRefresh,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  bounces = true,
  alwaysBounceVertical = true,
  overScrollMode = 'auto',
  stickyHeaderIndices,
  nestedScrollEnabled = false,
  scrollEnabled = true,
  ...props 
}) => {
  const scrollViewRef = useRef(null);

  const platformScrollViewStyles = Platform.select({
    web: {
      flex: 1,
      height: '100%',
      maxHeight: screenHeight,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
    ios: {
      flex: 1,
    },
    android: {
      flex: 1,
    },
    default: {
      flex: 1,
    }
  });

  const platformContentStyles = Platform.select({
    web: {
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    default: {
      // No special styles for native
    }
  });

  // Calculate header height (adjust based on your actual header height)
  const headerHeight = 80; // Approximate header height

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[
        styles.scrollView,
        platformScrollViewStyles,
        style,
        Platform.OS === 'web' && { maxHeight: `calc(100vh - ${headerHeight}px)` }
      ]}
      contentContainerStyle={[
        styles.contentContainer,
        platformContentStyles,
        contentContainerStyle
      ]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      bounces={bounces}
      alwaysBounceVertical={alwaysBounceVertical}
      overScrollMode={overScrollMode}
      scrollEnabled={scrollEnabled}
      nestedScrollEnabled={nestedScrollEnabled}
      stickyHeaderIndices={stickyHeaderIndices}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
            progressBackgroundColor={colors.card}
          />
        ) : null
      }
      scrollEventThrottle={16}
      removeClippedSubviews={false}
      {...props}
    >
      {children}
      
      {/* Add extra padding at the bottom for better scrolling */}
      {Platform.OS !== 'web' && <View style={{ height: 50 }} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    // Important for scrolling to work properly
    minHeight: Platform.OS === 'web' ? '100%' : undefined,
  },
});

// Helper View component
const View = ({ children, style }) => {
  return (
    <div style={style}>
      {children}
    </div>
  );
};

export default CustomScrollView;