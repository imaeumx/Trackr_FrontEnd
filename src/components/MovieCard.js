import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

const MovieCard = ({ 
  item, 
  index, 
  onPress,
  onAddToList, 
  itemsPerRow = 9,
  showLocalBadge = false
}) => {
  if (!item) return null;

  const horizontalPadding = 16;
  const itemSpacing = 8;
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = (availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;
  const cardHeight = cardWidth * 1.4;

  const handleCardPress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  const handleAddToList = () => {
    if (onAddToList) {
      onAddToList(item);
    }
  };

  return (
    <View 
      style={[
        globalStyles.movieCard,
        { 
          width: cardWidth,
          marginRight: (index + 1) % itemsPerRow === 0 ? 0 : itemSpacing,
          marginBottom: 16,
        }
      ]}
    >
      <TouchableOpacity 
        onPress={handleCardPress}
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
              {item.type === 'movie' ? 'FILM' : 'SERIES'}
            </Text>
          </View>
          {showLocalBadge && item.isLocal && (
            <View style={globalStyles.localBadge}>
              <Text style={globalStyles.localBadgeText}>Local</Text>
            </View>
          )}
        </View>
        <Text style={globalStyles.movieTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title || 'Unknown Title'}
        </Text>
        <Text style={globalStyles.movieYear} numberOfLines={1} ellipsizeMode="tail">
          {item.year || 'N/A'}
        </Text>
        <View style={globalStyles.ratingContainer}>
          <Ionicons name="star" size={8} color={colors.warning} />
          <Text style={globalStyles.rating}>{item.rating || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
      
      {item.showAddToList && (
        <TouchableOpacity
          style={{ 
            marginTop: 8, 
            flexDirection: 'row', 
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 6,
            justifyContent: 'center'
          }}
          onPress={handleAddToList}
          activeOpacity={0.6}
        >
          <Ionicons name="add" size={17} color="#fff" />
          <Text style={{ color: '#fff', marginLeft: 6, fontSize: 12, fontWeight: '600' }}>
            Add to List
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MovieCard;