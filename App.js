import React, { useState, useEffect, useRef } from 'react';
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
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import CreateListScreen from './src/screens/CreateListScreen';
import EditPlaylistScreen from './src/screens/EditPlaylistScreen';
import MyListsScreen from './src/screens/MyListsScreen';

import { authService } from './src/services/auth';
import { globalStyles, colors } from './src/styles/globalStyles';

const Stack = createStackNavigator();

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Home');
  const navigationRef = useRef(null);
  const routeNameRef = useRef(null);

  useEffect(() => {
    // Initialize auth when app starts
    const initApp = async () => {
      try {
        console.log('App: Initializing authentication...');
        
        // Initialize auth service (checks localStorage on web)
        const isAuthenticated = await authService.initialize();
        
        console.log('App: Auth initialization result:', isAuthenticated);
        
        // Load last visited route from localStorage
        try {
          const savedRoute = localStorage?.getItem('lastVisitedRoute');
          const validRoutes = ['Home', 'Films', 'Series', 'Playlist', 'Watchlist', 'Profile', 'MyLists', 'HelpSupport', 'ChangePassword', 'ResetPassword'];
          
          if (savedRoute && validRoutes.includes(savedRoute)) {
            console.log('App: Restoring last visited route:', savedRoute);
            setInitialRoute(savedRoute);
          } else if (savedRoute) {
            console.log('App: Saved route is invalid (needs params):', savedRoute, '- resetting to Home');
            localStorage?.removeItem('lastVisitedRoute');
          }
        } catch (err) {
          console.log('App: Could not restore route from localStorage:', err);
        }
        
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
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Get the initial route name after navigation is ready
        routeNameRef.current = navigationRef.current.getCurrentRoute().name;
        console.log('App: Navigation ready, initial route:', routeNameRef.current);
      }}
      onStateChange={async () => {
        // Get the current route name
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.current.getCurrentRoute().name;

        if (previousRouteName !== currentRouteName) {
          console.log('App: Route changed from', previousRouteName, 'to', currentRouteName);
          
          // Only save routes that don't require parameters to localStorage
          const routesWithoutParams = ['Home', 'Films', 'Series', 'Playlist', 'Watchlist', 'Profile', 'MyLists', 'HelpSupport', 'ChangePassword', 'ResetPassword'];
          
          if (routesWithoutParams.includes(currentRouteName)) {
            try {
              localStorage?.setItem('lastVisitedRoute', currentRouteName);
              console.log('App: Saved route to localStorage:', currentRouteName);
            } catch (err) {
              console.log('App: Could not save route to localStorage:', err);
            }
          } else {
            console.log('App: Route', currentRouteName, 'requires params, not saving to localStorage');
          }
        }

        // Always update the ref
        routeNameRef.current = currentRouteName;
      }}
    >
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
        <Stack.Screen name="Watchlist" component={PlaylistScreen} />
        <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
        <Stack.Screen name="Sign In" component={SignInScreen} />
        <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="CreateList" component={CreateListScreen} />
        <Stack.Screen name="EditPlaylist" component={EditPlaylistScreen} />
        <Stack.Screen name="MyLists" component={MyListsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;