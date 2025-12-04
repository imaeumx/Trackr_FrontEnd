// src/components/Header.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../styles/globalStyles';
import SearchDropdown from './SearchDropdown';

const Header = ({ 
  navigation, 
  activeScreen, 
  searchQuery, 
  setSearchQuery, 
  onSearch,
  isLoggedIn,
  currentUser,
  onProfilePress,
  searchPlaceholder = "Search...",
  searchEditable = true,
  searchResults = [],
  searchLoading = false,
  onSearchResultPress = null,
  onClearSearch = null
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setShowSearchDropdown(text.trim().length > 0);
  };

  const handleSearchResult = (item) => {
    if (onSearchResultPress) {
      onSearchResultPress(item);
    }
    setShowSearchDropdown(false);
  };

  return (
    <View style={globalStyles.header}>
      <Text style={globalStyles.logo}>TrackR</Text>
      
      <View style={globalStyles.rightContainer}>
        <View style={globalStyles.searchContainer}>
          <TextInput
            style={globalStyles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={onSearch}
            returnKeyType="search"
            editable={searchEditable}
          />
          <TouchableOpacity onPress={onSearch} style={globalStyles.searchButton}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <SearchDropdown 
            results={searchResults}
            loading={searchLoading}
            query={searchQuery}
            onResultPress={handleSearchResult}
            onClose={() => setShowSearchDropdown(false)}
            isVisible={showSearchDropdown}
          />
        </View>
        
        <View style={globalStyles.menuContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={[
              globalStyles.menuText, 
              activeScreen === 'Home' && globalStyles.activeMenuText
            ]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Films')}>
            <Text style={[
              globalStyles.menuText, 
              activeScreen === 'Films' && globalStyles.activeMenuText
            ]}>Films</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Series')}>
            <Text style={[
              globalStyles.menuText, 
              activeScreen === 'Series' && globalStyles.activeMenuText
            ]}>Series</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Playlist')}>
            <Text style={[
              globalStyles.menuText, 
              activeScreen === 'Playlist' && globalStyles.activeMenuText
            ]}>Playlist</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onProfilePress} style={globalStyles.profileButton}>
          <View style={globalStyles.profileContainer}>
            {isLoggedIn ? (
              <>
                <Ionicons name="person-circle" size={20} color={colors.primary} />
                <Text style={globalStyles.usernameText}>
                  {currentUser?.username || 'User'}
                </Text>
              </>
            ) : (
              <Text style={globalStyles.signInText}>Sign In</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;