// src/components/GridSection.js - WITH FIXED GRID
import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import MovieCard from './MovieCard';
import { globalStyles } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

const GridSection = ({
  title,
  data,
  onItemPress,
  onAddToList,
  itemsPerRow = 9,
  showLocalBadge = false,
  isLoggedIn = false
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={globalStyles.section}>
        <Text style={globalStyles.sectionTitle}>{title}</Text>
        <Text style={globalStyles.emptyText}>No items found</Text>
      </View>
    );
  }

  // Calculate card dimensions with fixed widths
  const horizontalPadding = 16;
  const itemSpacing = 8;
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = (availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;

  // Function to handle item press with proper parameters
  const handleItemPress = (item) => {
    if (onItemPress) {
      const itemData = {
        ...item,
        tmdbId: item.tmdb_id || item.id,
        mediaType: item.media_type || (item.type === 'series' ? 'tv' : 'movie')
      };
      onItemPress(itemData);
    }
  };

  const styles = StyleSheet.create({
    cardWrapper: {
      width: cardWidth,
      marginRight: (itemSpacing),
      marginBottom: 16,
      overflow: 'hidden',
    }
  });

  console.log('GridSection - isLoggedIn:', isLoggedIn, 'showAddToList:', isLoggedIn);

  return (
    <View style={globalStyles.section}>
      <Text style={globalStyles.sectionTitle}>{title}</Text>
      <View style={globalStyles.gridContainer}>
        {data.map((item, index) => {
          // Remove right margin on last item of each row
          const isLastInRow = (index + 1) % itemsPerRow === 0;
          return (
            <View
              key={item.id || index}
              style={[
                styles.cardWrapper,
                isLastInRow && { marginRight: 0 }
              ]}
            >
              <MovieCard
                item={{
                  ...item,
                  showAddToList: isLoggedIn,
                  isLoggedIn: isLoggedIn,
                }}
                index={index}
                onPress={() => handleItemPress(item)}
                onAddToList={onAddToList}
                itemsPerRow={itemsPerRow}
                showLocalBadge={showLocalBadge}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default GridSection;