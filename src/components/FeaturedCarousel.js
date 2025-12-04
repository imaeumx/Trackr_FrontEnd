// src/components/FeaturedCarousel.js - UPDATED (NO PAUSE/PLAY)
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';

const { width: screenWidth } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 500;

const FeaturedCarousel = ({ 
  title = "Featured", 
  items = [], 
  onItemPress,
  autoPlay = true,
  showIndicators = true,
  autoPlayInterval = 5000
}) => {
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});
  
  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % items.length;
      scrollToIndex(nextIndex);
    }, autoPlayInterval);
    
    return () => clearInterval(interval);
  }, [currentIndex, autoPlay, items.length, autoPlayInterval]);

  // Default featured items if none provided - UPDATED with proper movie data
  const defaultItems = [
    {
      id: 603,
      tmdbId: 603,
      title: 'The Matrix',
      description: 'Discover the reality-bending classic',
      image: 'https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      type: 'movie',
      color: '#FF6B35',
      rating: 8.7,
      year: 1999,
      poster: 'https://image.tmdb.org/t/p/original/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
    },
    {
      id: 157336,
      tmdbId: 157336,
      title: 'Interstellar',
      description: 'A journey through space and time',
      image: 'https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg',
      type: 'movie',
      color: '#4ECDC4',
      rating: 8.6,
      year: 2014,
      poster: 'https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg'
    },
    {
      id: 155,
      tmdbId: 155,
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc',
      image: 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      type: 'movie',
      color: '#2196F3',
      rating: 9.0,
      year: 2008,
      poster: 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg'
    }
  ];

  const featuredItems = items.length > 0 ? items : defaultItems;

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * screenWidth,
        animated: true
      });
      setCurrentIndex(index);
    }
  };

  const renderItem = (item, index) => (
    <TouchableOpacity
      key={item.id || index}
      style={styles.carouselItem}
      onPress={() => onItemPress && onItemPress({...item, tmdbId: item.tmdbId || item.id, mediaType: item.type === 'series' ? 'tv' : 'movie'})}
      activeOpacity={0.8}
    >
      <Image
        source={ failedImages[item.id] ? { uri: 'https://via.placeholder.com/1280x720?text=No+Image' } : { uri: item.image } }
        style={styles.carouselImage}
        resizeMode="cover"
        onError={() => {
          console.warn('FeaturedCarousel: failed to load image', item.image);
          setFailedImages(prev => ({ ...prev, [item.id]: true }));
        }}
      />
      <View style={styles.overlay} />
      <View style={styles.itemContent}>
        <View style={[styles.typeBadge, { backgroundColor: item.color || colors.primary }]}>
          <Text style={styles.typeText}>
            {item.type === 'movie' ? 'MOVIE' : item.type === 'series' ? 'SERIES' : 'PLAYLIST'}
          </Text>
        </View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>Explore</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.indicators}>
          {showIndicators && featuredItems.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      </View>
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.carousel}
      >
        {featuredItems.map((item, index) => renderItem(item, index))}
      </ScrollView>
      
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const prevIndex = currentIndex === 0 ? featuredItems.length - 1 : currentIndex - 1;
            scrollToIndex(prevIndex);
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        {/* Removed the pause/play button */}
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            const nextIndex = currentIndex === featuredItems.length - 1 ? 0 : currentIndex + 1;
            scrollToIndex(nextIndex);
          }}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
    width: 24,
  },
  carousel: {
    height: CAROUSEL_HEIGHT,
  },
  carouselItem: {
    width: screenWidth,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  itemContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
    opacity: 0.9,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FeaturedCarousel;
