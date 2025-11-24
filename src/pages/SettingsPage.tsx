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

  // Get backup directory - use documentDirectory for better file manager compatibility
  // documentDirectory is more accessible to file managers like "Files by Google" than cacheDirectory
  const getBackupDirectory = (): string => {
    // Use documentDirectory for both Android and iOS - better for sharing with file managers
    // Files in documentDirectory are more accessible to other apps than cacheDirectory
    return FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
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
        // On mobile, save the file to backup directory first
        const backupDir = getBackupDirectory();
        
        // Ensure the directory exists
        const dirInfo = await FileSystem.getInfoAsync(backupDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
        }
        
        const tempFileUri = backupDir + fileName;
        
        await FileSystem.writeAsStringAsync(tempFileUri, jsonString);
        
        // Verify file was created
        const tempFileInfo = await FileSystem.getInfoAsync(tempFileUri);
        if (!tempFileInfo.exists) {
          throw new Error('Failed to create backup file');
        }
        
        console.log('Backup file created:', tempFileUri, 'Size:', tempFileInfo.size);
        
        // On Android, use share dialog to save to Downloads
        // Due to Android 10+ scoped storage, we can't directly write to Downloads
        // The best approach is to use the share dialog and let user save via file manager
        if (Platform.OS === 'android') {
          try {
            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
              // For Android, use the file URI directly without file:// prefix
              // expo-sharing will handle the URI format correctly
              // Using the raw URI (without file://) sometimes works better with file managers
              let shareUri = tempFileUri;
              
              // Try without file:// prefix first - some file managers prefer this
              // expo-sharing should handle the URI format automatically
              
              // Show instructions and open share dialog
              const showShare = await new Promise<boolean>((resolve) => {
                Alert.alert(
                  'Export Complete - Save to Downloads',
                  `File exported successfully!\n\nTo save to Downloads:\n1. Tap "Open Share Dialog"\n2. Select "Files" or your file manager\n3. Navigate to Downloads folder\n4. Tap "Save"\n\nOr use the Share button in backup files list later.`,
                  [
                    { text: 'Skip', style: 'cancel', onPress: () => resolve(false) },
                    { text: 'Open Share Dialog', onPress: () => resolve(true) },
                  ]
                );
              });
              
              if (showShare) {
                // Try sharing with generic MIME type first - ensures "Files by Google" appears
                // Try multiple URI formats to find one that works
                let shareSucceeded = false;
                
                // Try 1: Raw URI (let expo-sharing handle it)
                try {
                  await Sharing.shareAsync(shareUri, {
                    mimeType: '*/*', // Generic MIME type - ensures file managers appear
                    dialogTitle: 'Save to Downloads',
                    UTI: 'public.json',
                  });
                  shareSucceeded = true;
                } catch (shareError1: any) {
                  console.log('Raw URI failed, trying with file:// prefix:', shareError1);
                  
                  // Try 2: With file:// prefix
                  try {
                    const fileUri = shareUri.startsWith('file://') ? shareUri : 'file://' + shareUri;
                    await Sharing.shareAsync(fileUri, {
                      mimeType: '*/*',
                      dialogTitle: 'Save to Downloads',
                      UTI: 'public.json',
                    });
                    shareSucceeded = true;
                  } catch (shareError2: any) {
                    console.log('file:// URI failed, trying application/octet-stream:', shareError2);
                    
                    // Try 3: With application/octet-stream
                    try {
                      await Sharing.shareAsync(shareUri, {
                        mimeType: 'application/octet-stream',
                        dialogTitle: 'Save to Downloads',
                        UTI: 'public.json',
                      });
                      shareSucceeded = true;
                    } catch (shareError3: any) {
                      console.log('application/octet-stream failed, trying application/json:', shareError3);
                      
                      // Try 4: With application/json
                      await Sharing.shareAsync(shareUri, {
                        mimeType: 'application/json',
                        dialogTitle: 'Save to Downloads',
                        UTI: 'public.json',
                      });
                      shareSucceeded = true;
                    }
                  }
                }
                
                if (!shareSucceeded) {
                  throw new Error('All sharing methods failed');
                }
              } else {
                Alert.alert(
                  'Export Complete',
                  `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to backup directory.\n\nYou can use the Share button in the backup files list to save to Downloads later.`
                );
              }
            } else {
              Alert.alert(
                'Export Complete',
                `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${tempFileUri}\n\nYou can use the Share button in the backup files list to save to Downloads.`
              );
            }
          } catch (shareError: any) {
            console.error('Error sharing file:', shareError);
            Alert.alert(
              'Export Complete',
              `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${tempFileUri}\n\nYou can use the Share button in the backup files list to save to Downloads.`
            );
          }
        } else {
          // iOS - file is already saved to documentDirectory
          Alert.alert(
            'Export Complete',
            `Exported ${songs.length} song${songs.length !== 1 ? 's' : ''} successfully!\n\nFile saved to:\n${tempFileUri}\n\nYou can use this file to backup or restore your library.`
          );
        }
        
        // Refresh backup files list after export
        await loadBackupFiles();
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
      
      // On Android, try multiple URI formats to find one that works with file managers
      let shareUri = file.uri;
      
      console.log('File info for sharing:', {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: file.uri,
        isDirectory: fileInfo.isDirectory
      });
      
      // Try to share the file with multiple URI formats and MIME types
      // Note: "Files by Google" may have limitations with content URIs
      // If it doesn't work, try Google Drive or other file managers
      console.log('Opening share dialog for:', shareUri);
      let shareSucceeded = false;
      
      // Try 1: Raw URI with text/plain MIME type (sometimes works better with Files by Google)
      try {
        await Sharing.shareAsync(shareUri, {
          mimeType: 'text/plain', // Try text/plain first - sometimes better for file managers
          dialogTitle: 'Share Backup File',
          UTI: 'public.json',
        });
        console.log('Share dialog opened successfully with text/plain');
        shareSucceeded = true;
      } catch (shareError0: any) {
        console.log('text/plain failed, trying */*:', shareError0);
        
        // Try 2: Raw URI with */* MIME type
        try {
          await Sharing.shareAsync(shareUri, {
            mimeType: '*/*', // Generic MIME type - ensures file managers appear in share dialog
            dialogTitle: 'Share Backup File',
            UTI: 'public.json',
          });
          console.log('Share dialog opened successfully with raw URI and */*');
          shareSucceeded = true;
        } catch (shareError1: any) {
          console.log('Raw URI with */* failed, trying file:// prefix:', shareError1);
          
          // Try 3: With file:// prefix
          try {
            const fileUri = shareUri.startsWith('file://') ? shareUri : 'file://' + shareUri;
            await Sharing.shareAsync(fileUri, {
              mimeType: '*/*',
              dialogTitle: 'Share Backup File',
              UTI: 'public.json',
            });
            console.log('Share dialog opened successfully with file:// URI');
            shareSucceeded = true;
          } catch (shareError2: any) {
            console.log('file:// URI failed, trying application/octet-stream:', shareError2);
            
            // Try 4: With application/octet-stream
            try {
              await Sharing.shareAsync(shareUri, {
                mimeType: 'application/octet-stream',
                dialogTitle: 'Share Backup File',
                UTI: 'public.json',
              });
              console.log('Share dialog opened successfully with application/octet-stream');
              shareSucceeded = true;
            } catch (shareError3: any) {
              console.log('application/octet-stream failed, trying application/json:', shareError3);
              
              // Try 5: With application/json
              try {
                await Sharing.shareAsync(shareUri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Share Backup File',
                  UTI: 'public.json',
                });
                console.log('Share dialog opened successfully with application/json');
                shareSucceeded = true;
              } catch (shareError4: any) {
                console.log('All methods failed, trying without MIME type:', shareError4);
                
                // Final fallback - try without MIME type
                await Sharing.shareAsync(shareUri, {
                  dialogTitle: 'Share Backup File',
                  UTI: 'public.json',
                });
                shareSucceeded = true;
              }
            }
          }
        }
      }
      
      if (!shareSucceeded) {
        throw new Error('All sharing methods failed');
      }
      
      // Show helpful message about Files by Google limitations
      // Note: This is shown after share dialog opens, so user can see it if they come back
      // We'll show it as a delayed alert
      setTimeout(() => {
        if (Platform.OS === 'android') {
          Alert.alert(
            'Note about Files by Google',
            'If "Files by Google" shows "We can\'t save this file", this is a known limitation.\n\nWorkarounds:\n• Use Google Drive (works perfectly)\n• Use another file manager app\n• Share via email/messaging and save the attachment\n\nThe file is accessible - this is specific to how Files by Google handles content URIs.',
            [{ text: 'OK' }]
          );
        }
      }, 2000);
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
      
      // Show instructions for Android users
      if (Platform.OS === 'android') {
        const showInstructions = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Import Songs',
            'To import a backup file:\n\n1. Tap "Open File Picker"\n2. Navigate to Downloads folder (or where you saved the backup file)\n3. Select the backup JSON file\n4. Tap "Import"\n\nNote: If you don\'t see your backup file, make sure it\'s a .json file and try navigating to the Downloads folder.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Open File Picker', onPress: () => resolve(true) },
            ]
          );
        });
        
        if (!showInstructions) {
          setImporting(false);
          return;
        }
      }
      
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

