import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';
import { songApi } from '../../app/services/api';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface BackupFile {
  name: string;
  uri: string;
  size?: number;
  modificationTime?: number;
}

export function SettingsPage() {
  const { songs, fetchSongs } = useSongs();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Get backup directory - use cache directory on Android for better ADB accessibility
  const getBackupDirectory = (): string => {
    if (Platform.OS === 'android') {
      // Use cache directory - more accessible via ADB than documentDirectory
      return FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    }
    // iOS and web use documentDirectory
    return FileSystem.documentDirectory || '';
  };

  const handleExportSongs = async () => {
    // Generate filename
    const fileName = `songbook-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Determine file path based on platform
    let filePath: string;
    const backupDir = getBackupDirectory();
    if (Platform.OS === 'web') {
      // On web, file will be saved to Downloads folder
      filePath = `Downloads/${fileName}`;
    } else {
      // On mobile, save to backup directory (cache on Android, documentDirectory on iOS)
      filePath = `${backupDir}${fileName}`;
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
        // On mobile, save the file to backup directory
        const backupDir = getBackupDirectory();
        const fileUri = backupDir + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, jsonString);
        
        // Verify file was created
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        if (!fileInfo.exists) {
          throw new Error('Failed to create backup file');
        }
        
        console.log('Backup file created:', fileUri, 'Size:', fileInfo.size);
        
        // Refresh backup files list after export
        await loadBackupFiles();
        
        // Use Sharing API to let user save/share the file (can save to Downloads)
        // On Android, we need to ensure the file is accessible for sharing
        try {
          const isSharingAvailable = await Sharing.isAvailableAsync();
          console.log('Sharing available:', isSharingAvailable);
          
          if (isSharingAvailable && Platform.OS !== 'web') {
            console.log('Opening share dialog for file:', fileUri);
            
            // Verify file exists and is readable
            const shareFileInfo = await FileSystem.getInfoAsync(fileUri);
            if (!shareFileInfo.exists) {
              throw new Error('File does not exist for sharing');
            }
            
            console.log('File info for sharing:', {
              exists: shareFileInfo.exists,
              size: shareFileInfo.size,
              uri: fileUri
            });
            
            // Share the file - this will open Android's share dialog
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/json',
              dialogTitle: 'Save Backup File',
              UTI: 'public.json',
            });
            console.log('Share dialog completed');
          } else {
            console.warn('Sharing not available, showing alert instead');
            throw new Error('Sharing not available');
          }
        } catch (sharingError: any) {
          console.error('Sharing error:', sharingError);
          console.error('Sharing error details:', {
            message: sharingError?.message,
            code: sharingError?.code,
            stack: sharingError?.stack
          });
          
          // Fallback to alert if sharing fails
          const message = Platform.OS === 'android'
            ? `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${fileUri}\n\nTo access:\n1. Use the "Share" button in the backup files list below\n2. Or use ADB: adb backup -noapk com.mysongbook.app`
            : `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${fileUri}\n\nYou can use this file to backup or restore your library.`;
          Alert.alert('Export Complete', message);
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

  // Load backup files list
  const loadBackupFiles = async () => {
    if (Platform.OS === 'web') {
      // On web, we can't list files from Downloads folder
      setBackupFiles([]);
      return;
    }

    setLoadingBackups(true);
    try {
      const backupDir = getBackupDirectory();
      if (!backupDir) {
        setBackupFiles([]);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backupFilesList: BackupFile[] = [];
      
      for (const fileName of files) {
        if (fileName.startsWith('songbook-export-') && fileName.endsWith('.json')) {
          const fileUri = backupDir + fileName;
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists && fileInfo.size !== undefined) {
              backupFilesList.push({
                name: fileName,
                uri: fileUri,
                size: fileInfo.size,
                modificationTime: fileInfo.modificationTime,
              });
            }
          } catch (error) {
            console.error(`Error getting info for ${fileName}:`, error);
            // Still add the file even if we can't get info
            backupFilesList.push({
              name: fileName,
              uri: fileUri,
            });
          }
        }
      }
      
      // Sort by modification time (newest first)
      backupFilesList.sort((a, b) => {
        const timeA = a.modificationTime || 0;
        const timeB = b.modificationTime || 0;
        return timeB - timeA;
      });
      
      setBackupFiles(backupFilesList);
    } catch (error: any) {
      console.error('Error loading backup files:', error);
      // Don't show error to user, just set empty list
      setBackupFiles([]);
    } finally {
      setLoadingBackups(false);
    }
  };

  // Load backup files on mount and after export
  useEffect(() => {
    loadBackupFiles();
  }, []);

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Save backup file to Downloads folder (Android)
  const handleSaveToDownloads = async (file: BackupFile) => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'On web, use the Share button to download the file.');
      return;
    }

    try {
      console.log('Attempting to save file to Downloads:', file.uri);
      
      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist');
        return;
      }

      // On Android, show instructions for saving to Downloads
      // The share dialog shows different apps based on what's installed
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          'Sharing Not Available',
          `File location:\n${file.uri}\n\nYou can access this file using a file manager app or ADB.`
        );
        return;
      }

      // Show comprehensive instructions
      const instructions = `To save to Downloads, look for these apps in the share dialog:\n\n• "Files" or "Files by Google"\n• "My Files" (Samsung)\n• "File Manager"\n• "Solid Explorer"\n• "Total Commander"\n• Any file manager app\n\nThen:\n1. Select the file manager app\n2. Navigate to Downloads folder\n3. Tap "Save" or "Copy"\n\nIf you don't see a file manager, you can:\n• Install "Files by Google" from Play Store\n• Use the Share button and select email/messaging to send to yourself\n• Access the file directly at:\n${file.uri}`;

      const showShareDialog = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
        ? window.confirm(instructions + '\n\nClick OK to open the share dialog.')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Save to Downloads',
              instructions,
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Open Share Dialog', onPress: () => resolve(true) },
              ],
              { cancelable: true }
            );
          });

      if (!showShareDialog) return;

      // Open share dialog
      let shareUri = file.uri;
      if (Platform.OS === 'android' && !shareUri.startsWith('file://') && !shareUri.startsWith('content://')) {
        shareUri = 'file://' + shareUri;
      }

      await Sharing.shareAsync(shareUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save to Downloads - Select File Manager',
        UTI: 'public.json',
      });
    } catch (error: any) {
      console.error('Error saving to Downloads:', error);
      Alert.alert(
        'Error',
        `Could not open share dialog: ${error?.message || 'Unknown error'}\n\nFile location: ${file.uri}\n\nYou can access this file using a file manager app.`
      );
    }
  };

  // Share backup file
  const handleShareBackup = async (file: BackupFile) => {
    try {
      console.log('Attempting to share file:', file.uri);
      
      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'File does not exist');
        return;
      }
      
      console.log('File exists, checking sharing availability');
      const isSharingAvailable = await Sharing.isAvailableAsync();
      console.log('Sharing available:', isSharingAvailable);
      
      if (!isSharingAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device. You can use ADB backup command to access the file.');
        return;
      }
      
      // On Android, ensure the file URI is properly formatted for sharing
      let shareUri = file.uri;
      
      // Try to share the file
      console.log('Opening share dialog for:', shareUri);
      try {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'application/json',
          dialogTitle: 'Share Backup File',
          UTI: 'public.json',
        });
        console.log('Share dialog opened successfully');
      } catch (shareError: any) {
        console.error('Share error:', shareError);
        // If sharing fails, try with file:// prefix if not already present
        if (Platform.OS === 'android' && !shareUri.startsWith('file://') && !shareUri.startsWith('content://')) {
          shareUri = 'file://' + shareUri;
          console.log('Retrying with file:// prefix:', shareUri);
          await Sharing.shareAsync(shareUri, {
            mimeType: 'application/json',
            dialogTitle: 'Share Backup File',
            UTI: 'public.json',
          });
        } else {
          throw shareError;
        }
      }
    } catch (error: any) {
      console.error('Error sharing backup file:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      });
      Alert.alert(
        'Error Sharing File',
        `Failed to share file: ${error?.message || 'Unknown error'}\n\nAlternative options:\n1. Use ADB backup command\n2. The file is saved in the app's cache directory\n3. Try exporting again and use the share dialog that appears`
      );
    }
  };

  // Delete backup file
  const handleDeleteBackup = async (file: BackupFile) => {
    const confirmMessage = `Delete backup file?\n\nFile: ${file.name}\nSize: ${formatFileSize(file.size)}\nDate: ${formatDate(file.modificationTime)}\n\nThis action cannot be undone.`;

    const confirmed = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
      ? window.confirm(confirmMessage)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Delete Backup File',
            confirmMessage,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) {
      return;
    }

    setDeletingFile(file.name);
    try {
      await FileSystem.deleteAsync(file.uri, { idempotent: true });
      
      // Refresh backup files list
      await loadBackupFiles();
      
      const successMessage = `Backup file deleted successfully:\n${file.name}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(successMessage);
      } else {
        Alert.alert('Success', successMessage);
      }
    } catch (error: any) {
      console.error('Error deleting backup file:', error);
      const errorMessage = error?.message || 'Failed to delete backup file';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setDeletingFile(null);
    }
  };

  const handleImportSongs = async () => {
    setImporting(true);
    try {
      console.log('Opening document picker for import');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json', '*/*'], // Allow all file types as fallback
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', result);

      if (result.canceled || !result.assets[0]) {
        console.log('Document picker canceled or no file selected');
        setImporting(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', {
        name: file.name,
        uri: file.uri,
        size: file.size,
        mimeType: file.mimeType
      });

      let jsonData: any;

      if (Platform.OS === 'web') {
        // For web, read the file
        console.log('Reading file on web');
        const response = await fetch(file.uri);
        if (!response.ok) {
          throw new Error(`Failed to read file: ${response.statusText}`);
        }
        jsonData = await response.json();
      } else {
        // For mobile, read from file system
        console.log('Reading file from file system:', file.uri);
        
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists) {
          throw new Error(`File does not exist: ${file.uri}`);
        }
        
        console.log('File exists, reading content');
        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        console.log('File content length:', fileContent.length);
        jsonData = JSON.parse(fileContent);
      }
      
      console.log('Parsed JSON data, songs count:', jsonData.songs?.length || 0);

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

      {/* Backup Files List */}
      {Platform.OS !== 'web' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Backup Files ({backupFiles.length})</Text>
            <TouchableOpacity
              onPress={loadBackupFiles}
              disabled={loadingBackups}
              style={[styles.refreshButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.refreshButtonText, { color: theme.text }]}>
                {loadingBackups ? 'Loading...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {loadingBackups ? (
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>Loading backup files...</Text>
          ) : backupFiles.length === 0 ? (
            <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
              No backup files found. Export songs to create a backup file.
            </Text>
          ) : (
            <View style={styles.backupFilesList}>
              {backupFiles.map((file) => (
                <View key={file.name} style={[styles.backupFileItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.backupFileInfo}>
                    <Text style={[styles.backupFileName, { color: theme.text }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Text style={[styles.backupFileDetails, { color: theme.textSecondary }]}>
                      {formatFileSize(file.size)} • {formatDate(file.modificationTime)}
                    </Text>
                    <Text style={[styles.backupFilePath, { color: theme.textSecondary }]} numberOfLines={1}>
                      {file.uri}
                    </Text>
                  </View>
                  <View style={styles.backupFileActions}>
                    {Platform.OS !== 'web' && (
                      <TouchableOpacity
                        style={[
                          styles.saveToDownloadsButton,
                          { backgroundColor: '#10b981', borderColor: '#10b981' }
                        ]}
                        onPress={() => handleSaveToDownloads(file)}
                      >
                        <Text style={[styles.saveToDownloadsButtonText, { color: '#ffffff' }]}>
                          Save to Downloads
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.shareBackupButton,
                        { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => handleShareBackup(file)}
                    >
                      <Text style={[styles.shareBackupButtonText, { color: theme.primaryText }]}>
                        Share
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.deleteBackupButton,
                        { backgroundColor: theme.error, borderColor: theme.error },
                        deletingFile === file.name && styles.buttonDisabled
                      ]}
                      onPress={() => handleDeleteBackup(file)}
                      disabled={deletingFile === file.name}
                    >
                      <Text style={[styles.deleteBackupButtonText, { color: theme.errorText }]}>
                        {deletingFile === file.name ? 'Deleting...' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  backupFilesList: {
    gap: 8,
  },
  backupFileItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backupFileInfo: {
    flex: 1,
    marginRight: 12,
  },
  backupFileActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  saveToDownloadsButton: {
    padding: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveToDownloadsButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  shareBackupButton: {
    padding: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBackupButtonText: {
    fontSize: Platform.OS === 'web' ? 12 : 13,
    fontWeight: '600',
  },
  backupFileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  backupFileDetails: {
    fontSize: 12,
    marginBottom: 2,
  },
  backupFilePath: {
    fontSize: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
    marginTop: 4,
  },
  deleteBackupButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  deleteBackupButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

