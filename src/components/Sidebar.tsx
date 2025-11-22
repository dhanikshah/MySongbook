import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../app/context/ThemeContext';

interface SidebarProps {
  activeRoute?: string;
}

export function Sidebar({ activeRoute }: SidebarProps) {
  console.log('Sidebar: Rendering');
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();

  const navItems = [
    { id: 'Library', label: 'Library' },
    { id: 'AddSong', label: 'Add Song' },
    { id: 'Search', label: 'Search' },
    { id: 'Settings', label: 'Settings' },
  ];

  const isActive = (routeName: string) => {
    return route.name === routeName || activeRoute === routeName;
  };

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  return (
    <View style={[styles.sidebar, { backgroundColor: '#ffffff', borderRightColor: theme.border }]}>
      {/* App Title */}
      <Text style={[styles.title, { color: theme.primary, fontWeight: 'bold' }]}>Songbook</Text>

      {/* Navigation Items */}
      <View style={styles.navContainer}>
        {navItems.map((item) => {
          const active = isActive(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigate(item.id)}
              style={[
                styles.navItem,
                ...(active ? [{ backgroundColor: theme.selected }] : [])
              ]}
            >
              <Text style={[
                styles.navLabel,
                { color: theme.text },
                ...(active ? [styles.navLabelActive, { color: theme.primary, fontWeight: 'bold' }] : [])
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    height: '100%',
    borderRightWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'normal',
    marginTop: 0,
    marginBottom: 20,
  },
  navContainer: {
    paddingTop: 0,
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  navLabelActive: {
    // Active styles applied via inline styles
  },
});

