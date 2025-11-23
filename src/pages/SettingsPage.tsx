import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';
import { songApi } from '../../app/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Conditionally import Sharing (may not be installed)
let Sharing: any = null;
try {
  Sharing = require('expo-sharing');
} catch (e) {
  console.log('expo-sharing not available');
}

export function SettingsPage() {
  const { songs, fetchSongs } = useSongs();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportSongs = async () => {
    // Generate filename
    const fileName = `songbook-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Determine file path based on platform
    let filePath: string;
    if (Platform.OS === 'web') {
      // On web, file will be saved to Downloads folder
      filePath = `Downloads/${fileName}`;
    } else {
      // On mobile, show the actual file system path
      filePath = `${FileSystem.documentDirectory}${fileName}`;
    }

    // Show confirmation dialog with file path
    const confirmMessage = Platform.OS === 'web'
      ? `Export ${songs.length} song${songs.length !== 1 ? 's' : ''} to backup file?\n\nFile will be saved to:\n${filePath}\n\nYou can use this file to backup or restore your library.`
      : `Export ${songs.length} song${songs.length !== 1 ? 's' : ''} to backup file?\n\nFile will be saved to:\n${filePath}\n\nYou can use this file to backup or restore your library.`;

    const confirmed = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
      ? window.confirm(confirmMessage)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Export/Backup Songs',
            confirmMessage,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Export', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) {
      return; // User cancelled
    }

    setExporting(true);
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalSongs: songs.length,
        songs: songs.map(song => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          type: song.type,
          key: song.key,
          tags: song.tags,
          extractedText: song.extractedText,
          rawFileUrl: song.rawFileUrl,
          createdAt: song.createdAt,
          updatedAt: song.updatedAt,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (window.alert) {
          window.alert(`Songs exported successfully!\n\nFile: ${fileName}\nLocation: Downloads folder\nSongs: ${songs.length}\n\nYou can use this file to backup or restore your library.`);
        }
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        if (Sharing && await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Export Complete', `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${fileUri}\n\nYou can use this file to backup or restore your library.`);
        }
      }
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error?.message || 'Failed to export songs';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleImportSongs = async () => {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets[0]) {
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      let jsonData: any;

      if (Platform.OS === 'web') {
        // For web, read the file
        const response = await fetch(file.uri);
        jsonData = await response.json();
      } else {
        // For mobile, read from file system
        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        jsonData = JSON.parse(fileContent);
      }

      // Validate the import data
      if (!jsonData.songs || !Array.isArray(jsonData.songs)) {
        throw new Error('Invalid import file format. Expected a JSON file with a "songs" array.');
      }

      const songsToImport = jsonData.songs;
      const count = songsToImport.length;

      const confirmed = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
        ? window.confirm(`Import ${count} song${count > 1 ? 's' : ''}? This will add them to your library.`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Import Songs',
              `Import ${count} song${count > 1 ? 's' : ''}? This will add them to your library.`,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Import', onPress: () => resolve(true) },
              ]
            );
          });

      if (!confirmed) {
        setImporting(false);
        return;
      }

      // Import each song
      let imported = 0;
      let failed = 0;

      for (const songData of songsToImport) {
        try {
          // Check if song already exists (by ID)
          const exists = songs.some(s => s.id === songData.id);
          if (exists) {
            console.log(`Song "${songData.title}" already exists, skipping...`);
            continue;
          }

          await songApi.create({
            title: songData.title || 'Untitled',
            artist: Array.isArray(songData.artist) ? songData.artist : (songData.artist ? [songData.artist] : []),
            type: songData.type || 'chords',
            key: songData.key || '',
            tags: songData.tags || [],
            extractedText: songData.extractedText || '',
          });
          imported++;
        } catch (error: any) {
          console.error(`Failed to import song "${songData.title}":`, error);
          failed++;
        }
      }

      // Refresh songs list
      await fetchSongs();

      const message = `Import complete!\n\nImported: ${imported} song${imported !== 1 ? 's' : ''}\nFailed: ${failed} song${failed !== 1 ? 's' : ''}`;
      
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(message);
      } else {
        Alert.alert('Import Complete', message);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error?.message || 'Failed to import songs';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.container, { padding: Platform.OS === 'web' ? 24 : 12, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      {/* Export/Backup Songs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Export/Backup Songs</Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.card, borderColor: theme.border },
            exporting && styles.buttonDisabled
          ]}
          onPress={handleExportSongs}
          disabled={exporting}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {exporting ? 'Exporting...' : `Export Songs (${songs.length})`}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Export all your songs to a JSON file. This can be used as a backup or to transfer songs to another device. The file includes all song data: titles, artists, keys, tags, lyrics/chords, and metadata.
        </Text>
      </View>

      {/* Import Songs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Import Songs</Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.card, borderColor: theme.border },
            importing && styles.buttonDisabled
          ]}
          onPress={handleImportSongs}
          disabled={importing}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>
            {importing ? 'Importing...' : 'Import Songs from File'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
          Import songs from a JSON file. The file should be exported from this app. Duplicate songs (same ID) will be skipped.
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'web' ? 0 : 80, // Extra space for bottom nav on mobile
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 24 : 22,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: Platform.OS === 'web' ? 24 : 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
  },
  themeOptionActive: {
    // Active styles applied via inline styles
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    // Active text styles applied via inline styles
  },
      button: {
        borderWidth: 1,
        borderRadius: 8,
        padding: Platform.OS === 'web' ? 16 : 18,
        marginBottom: Platform.OS === 'web' ? 8 : 12,
        alignItems: 'center',
      },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionDescription: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

