import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { Sidebar } from './Sidebar';
import { BottomNavigation } from './BottomNavigation';

interface AppWrapperProps {
  children: React.ReactNode;
}

export function AppWrapper({ children }: AppWrapperProps) {
  const { theme } = useTheme();
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    // Web layout: Sidebar on left
    return (
      <View style={[styles.app, { backgroundColor: theme.background }]}>
        <Sidebar />
        <View style={[styles.content, styles.webContent, { backgroundColor: theme.background }]}>
          {children}
        </View>
      </View>
    );
  }

  // Mobile layout: Full screen with bottom navigation
  return (
    <View style={[styles.app, styles.mobileApp, { backgroundColor: theme.background }]}>
      <View style={[styles.content, styles.mobileContent, { backgroundColor: theme.background }]}>
        {children}
      </View>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? { height: '100vh' as any, minHeight: '100vh' as any } : { height: '100%', minHeight: '100%' }),
    display: 'flex',
    flexDirection: 'row',
  },
  webContent: {
    flex: 1,
    padding: 24,
    minWidth: 0, // Important for flex children
    width: '100%',
    overflow: 'visible',
  },
  mobileApp: {
    paddingBottom: 60, // Space for bottom navigation
  },
  content: {
    flex: 1,
    width: '100%',
    minWidth: 0, // Important for flex children
  },
  mobileContent: {
    padding: 12,
  },
});

