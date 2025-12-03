import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
// Loading UI
import LoadingScreen from './src/components/LoadingScreen';

// Import ALL your screens
import HomeScreen from './src/screens/HomeScreen';
import FilmsScreen from './src/screens/FilmsScreen';
import SeriesScreen from './src/screens/SeriesScreen';
import PlaylistScreen from './src/screens/PlaylistScreen';
import PlaylistDetailScreen from './src/screens/PlaylistDetailScreen';
import SignInScreen from './src/screens/SignInScreen';
import MovieDetailScreen from './src/screens/MovieDetailScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import CreateListScreen from './src/screens/CreateListScreen';
import MyListsScreen from './src/screens/MyListsScreen';

import { authService } from './src/services/auth';
import { globalStyles, colors } from './src/styles/globalStyles';

const Stack = createStackNavigator();

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Home');

  useEffect(() => {
    // Initialize auth when app starts
    const initApp = async () => {
      try {
        console.log('App: Initializing authentication...');
        
        // Initialize auth service (checks localStorage on web)
        const isAuthenticated = await authService.initialize();
        
        console.log('App: Auth initialization result:', isAuthenticated);
        
        // Keep initial route as Home regardless of auth status
        // (Authentication state is still available to screens via authService/useAuth)
        
      } catch (error) {
        console.error('App: Failed to initialize auth:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    initApp();
  }, []);

  // Show loading screen while initializing
  if (!isAppReady) {
    return (
      <>
        <StatusBar style="light" />
        <LoadingScreen message="Loading TrackR..." />
      </>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1A1B1D',
          },
          headerTintColor: '#F5F5F5',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: '#141517'
          },
          headerShown: false
        }}
      >
        {/* Register ALL your screens */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Films" component={FilmsScreen} />
        <Stack.Screen name="Series" component={SeriesScreen} />
        <Stack.Screen name="Playlist" component={PlaylistScreen} />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
        <Stack.Screen name="Sign In" component={SignInScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="CreateList" component={CreateListScreen} />
        <Stack.Screen name="MyLists" component={MyListsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;