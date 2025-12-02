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
const CAROUSEL_HEIGHT = 200;

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

  // Default featured items if none provided
  const defaultItems = [
    {
      id: 1,
      title: 'New Releases',
      description: 'Discover the latest movies and series',
      image: 'https://image.tmdb.org/t/p/w1280/8Gxv8gSFCU0XGDykEGv7zR1n8ua.jpg',
      type: 'movie',
      color: '#FF6B35'
    },
    {
      id: 2,
      title: 'Trending Now',
      description: 'See what everyone is watching',
      image: 'https://image.tmdb.org/t/p/w1280/jD98aUKHQZNAmrk0wQQ9wH8dYGC.jpg',
      type: 'series',
      color: '#00D084'
    },
    {
      id: 3,
      title: 'Staff Picks',
      description: 'Curated by our movie experts',
      image: 'https://image.tmdb.org/t/p/w1280/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      type: 'movie',
      color: '#9C27B0'
    },
    {
      id: 4,
      title: 'Coming Soon',
      description: 'Upcoming releases to get excited about',
      image: 'https://image.tmdb.org/t/p/w1280/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      type: 'movie',
      color: '#2196F3'
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
      onPress={() => onItemPress ? onItemPress(item) : null}
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
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: colors.primary,
    width: 24,
  },
  carousel: {
    height: CAROUSEL_HEIGHT,
  },
  carouselItem: {
    width: screenWidth - 32,
    height: CAROUSEL_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  itemContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  itemTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
});

export default FeaturedCarousel;