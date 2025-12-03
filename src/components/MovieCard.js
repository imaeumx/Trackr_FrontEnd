// src/components/MovieCard.js - UPDATED WITH PROPER SIZING
import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

const MovieCard = ({ 
  item, 
  index, 
  onPress, 
  itemsPerRow = 9,
  showLocalBadge = false
}) => {
  if (!item) return null;

  // Function to handle Add to List press
  const handleAddToListPress = (e) => {
    if (e && e.stopPropagation) e.stopPropagation(); // Prevent card press
    
    // Just trigger the main onPress to go to detail page
    if (onPress) {
      onPress(item);
    }
  };

  // Calculate dynamic width based on itemsPerRow
  const horizontalPadding = 16; // padding from globalStyles.section
  const itemSpacing = 8; // marginRight in MovieCard style
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = (availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;
  const cardHeight = cardWidth * 1.4; // Maintain 1.4 aspect ratio

  // Debug log
  if (index === 0) {
    console.log('MovieCard - First card showAddToList:', item.showAddToList, 'isLoggedIn:', item.isLoggedIn);
  }

  return (
    <TouchableOpacity 
      style={[
        globalStyles.movieCard,
        { 
          width: cardWidth,
          marginRight: (index + 1) % itemsPerRow === 0 ? 0 : itemSpacing,
          marginBottom: 16,
        }
      ]}
      onPress={() => onPress && onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[globalStyles.movieImageContainer, { height: cardHeight }]}>
        {item.poster ? (
          <Image 
            source={{ uri: item.poster }} 
            style={[globalStyles.movieImage, { height: cardHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[globalStyles.movieImage, globalStyles.movieImagePlaceholder, { height: cardHeight }]}>
            <Ionicons 
              name={item.type === 'movie' ? 'film' : 'tv'} 
              size={14} 
              color={colors.textSecondary} 
            />
          </View>
        )}
        <View style={[
          globalStyles.typeBadge,
          { backgroundColor: item.type === 'movie' ? colors.primary : colors.secondary }
        ]}>
          <Text style={globalStyles.typeText}>
            {item.type === 'movie' ? 'MOVIE' : 'SERIES'}
          </Text>
        </View>
        {showLocalBadge && item.isLocal && (
          <View style={globalStyles.localBadge}>
            <Text style={globalStyles.localBadgeText}>Local</Text>
          </View>
        )}
      </View>
      <Text style={globalStyles.movieTitle} numberOfLines={2}>
        {item.title || 'Unknown Title'}
      </Text>
      <Text style={globalStyles.movieYear}>
        {item.year || 'N/A'}
      </Text>
      <View style={globalStyles.ratingContainer}>
            <Ionicons name="star" size={8} color={colors.warning} />
        <Text style={globalStyles.rating}>{item.rating || 'N/A'}</Text>
      </View>
      {/* Optional Add to List button in card footer */}
      {item.showAddToList && (
        <TouchableOpacity
          style={{ 
            marginTop: 6, 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 4,
            justifyContent: 'center'
          }}
          onPress={handleAddToListPress}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={12} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 4, fontSize: 10, fontWeight: '600' }}>
            Add to List
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default MovieCard;