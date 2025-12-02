// src/components/MovieCard.js - UPDATED WITH PROPER SIZING
import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
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

  // Calculate dynamic width based on itemsPerRow
  const horizontalPadding = 16; // padding from globalStyles.section
  const itemSpacing = 8; // marginRight in MovieCard style
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = (availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;
  const cardHeight = cardWidth * 1.4; // Maintain 1.4 aspect ratio

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
      onPress={onPress}
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
    </TouchableOpacity>
  );
};

export default MovieCard;