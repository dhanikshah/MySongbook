import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Platform, Linking } from 'react-native';
import { injectFavicon } from './app/utils/webAssets';
import { ThemeProvider, useTheme } from './app/context/ThemeContext';
import { AppWrapper } from './src/components/AppWrapper';
import { LibraryPage } from './src/pages/LibraryPage';
import { AddSongPage } from './src/pages/AddSongPage';
import { SongViewerPage } from './src/pages/SongViewerPage';
import { SearchPage } from './src/pages/SearchPage';
import { ChordLibraryPage } from './src/pages/ChordLibraryPage';
import { SettingsPage } from './src/pages/SettingsPage';

// Import global CSS for web
import './global.css';

const Stack = createNativeStackNavigator();

// Wrapper component to add AppWrapper layout
function withAppWrapper(Component: React.ComponentType<any>) {
  return (props: any) => {
    return (
      <AppWrapper>
        <Component {...props} />
      </AppWrapper>
    );
  };
}

// Inner app component that uses theme
function AppContent() {
  const { theme, isDark } = useTheme();
  const navigationRef = useRef<any>(null);

  // Inject favicon for web (optional - Expo handles it via app.json, but this ensures it's set)
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        injectFavicon();
      } catch (error) {
        // Non-critical error - Expo will handle favicon via app.json
        console.log('Favicon injection skipped (non-critical)');
      }
    }
  }, []);

  // Update document background color for web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.background;
      document.body.style.color = theme.text;
    }
  }, [theme]);

  // Configure linking for web browser back/forward buttons
  const linking = Platform.OS === 'web' ? {
    enabled: true,
    prefixes: ['/'],
    config: {
      screens: {
        Library: '/',
        AddSong: '/add-song',
        SongViewer: '/song/:songId',
        Search: '/search',
        ChordLibrary: '/chord-library',
        Settings: '/settings',
      },
    },
  } : undefined;

  // Handle browser back/forward on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = () => {
        // NavigationContainer will handle this automatically with linking config
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator
          initialRouteName="Library"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Library"
            component={withAppWrapper(LibraryPage)}
          />
          <Stack.Screen
            name="AddSong"
            component={withAppWrapper(AddSongPage)}
          />
          <Stack.Screen
            name="SongViewer"
            component={withAppWrapper(SongViewerPage)}
          />
          <Stack.Screen
            name="Search"
            component={withAppWrapper(SearchPage)}
          />
          <Stack.Screen
            name="ChordLibrary"
            component={withAppWrapper(ChordLibraryPage)}
          />
          <Stack.Screen
            name="Settings"
            component={withAppWrapper(SettingsPage)}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

