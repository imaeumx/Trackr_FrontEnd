// src/components/GridSection.js - WITH FIXED GRID
import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import MovieCard from './MovieCard';
import { globalStyles } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');

const GridSection = ({ 
  title, 
  data, 
  onItemPress, 
  itemsPerRow = 9,
  showLocalBadge = false 
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={globalStyles.section}>
        <Text style={globalStyles.sectionTitle}>{title}</Text>
        <Text style={globalStyles.emptyText}>No items found</Text>
      </View>
    );
  }

  // Calculate card dimensions
  const horizontalPadding = 16; // From globalStyles.section
  const itemSpacing = 8;
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = (availableWidth - (itemSpacing * (itemsPerRow - 1))) / itemsPerRow;

  return (
    <View style={globalStyles.section}>
      <Text style={globalStyles.sectionTitle}>{title}</Text>
      <View style={globalStyles.gridContainer}>
        {data.map((item, index) => (
          <View
            key={item.id || index}
            style={{
              width: cardWidth,
              marginRight: (index + 1) % itemsPerRow === 0 ? 0 : itemSpacing,
              marginBottom: 16,
            }}
          >
            <MovieCard
              item={item}
              index={index}
              onPress={() => onItemPress(item)}
              itemsPerRow={itemsPerRow}
              showLocalBadge={showLocalBadge}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default GridSection;