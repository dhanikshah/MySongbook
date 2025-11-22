import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSongs } from '../hooks/useSongs';

export function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const { songs } = useSongs();

  const handleExport = () => {
    // Export functionality would go here
    Alert.alert('Export', 'Export functionality coming soon!');
  };

  const handleBackup = () => {
    // Backup functionality would go here
    Alert.alert('Backup', 'Backup functionality coming soon!');
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Settings
        </Text>

        {/* Theme */}
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                Dark Mode
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Toggle dark theme
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={darkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Stats */}
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Statistics
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            Total Songs: {songs.length}
          </Text>
        </View>

        {/* Export */}
        <TouchableOpacity
          onPress={handleExport}
          className="bg-blue-500 dark:bg-blue-600 rounded-lg px-6 py-4 items-center mb-4"
        >
          <Text className="text-white text-lg font-semibold">Export Data</Text>
        </TouchableOpacity>

        {/* Backup */}
        <TouchableOpacity
          onPress={handleBackup}
          className="bg-green-500 dark:bg-green-600 rounded-lg px-6 py-4 items-center mb-4"
        >
          <Text className="text-white text-lg font-semibold">Backup Data</Text>
        </TouchableOpacity>

        {/* About */}
        <View className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            About
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            My Songbook v1.0.0
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-2">
            Cross-platform lyrics and chords app with OCR and transposition
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

