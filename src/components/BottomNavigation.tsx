import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../app/context/ThemeContext';

export function BottomNavigation() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { theme } = useTheme();

  const navItems = [
    { id: 'Library', label: 'Library', icon: '📚' },
    { id: 'AddSong', label: 'Add', icon: '➕' },
    { id: 'Search', label: 'Search', icon: '🔍' },
    { id: 'Settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (routeName: string) => {
    return route.name === routeName;
  };

  const handleNavigate = (routeName: string) => {
    navigation.navigate(routeName);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {navItems.map((item) => {
        const active = isActive(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => handleNavigate(item.id)}
            style={styles.navItem}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[
              styles.label,
              { color: active ? theme.primary : theme.textSecondary },
              ...(active ? [styles.labelActive] : [])
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: 'bold',
  },
});

