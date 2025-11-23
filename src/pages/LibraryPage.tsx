import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, useWindowDimensions, SafeAreaView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';

export function LibraryPage() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { songs, loading, fetchSongs, deleteSong } = useSongs();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Refresh songs when page comes into focus (e.g., after deleting/editing a song)
  // This handles both initial load and when returning to the page
  useFocusEffect(
    React.useCallback(() => {
      console.log('LibraryPage: Page focused, fetching songs...');
      fetchSongs().catch(error => {
        console.error('LibraryPage: Error fetching songs:', error);
      });
    }, [fetchSongs])
  );

  // Auto-refresh periodically to detect deletions/additions from other devices
  // Only refresh when page is focused and on mobile (web can use manual refresh)
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    let initialTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Only enable auto-refresh on mobile devices (not web)
    if (Platform.OS === 'web') {
      return; // Disable auto-refresh on web to save costs
    }

    // Wait 60 seconds before first auto-refresh, then continue every 60 seconds
    initialTimeout = setTimeout(() => {
      if (!isMounted || !isFocused) {
        return;
      }

      // First refresh after 60 seconds
      console.log('LibraryPage: Auto-refreshing songs (silent, first refresh)...');
      fetchSongs(undefined, true).catch(error => {
        console.error('LibraryPage: Error auto-refreshing songs:', error);
      });

      // Then set up interval for subsequent refreshes
      refreshInterval = setInterval(() => {
        if (!isMounted) {
          if (refreshInterval) clearInterval(refreshInterval);
          return;
        }
        
        // Only refresh if page is focused
        if (!isFocused) {
          return;
        }
        
        console.log('LibraryPage: Auto-refreshing songs (silent)...');
        // Use silent mode to avoid showing loading spinner during auto-refresh
        fetchSongs(undefined, true).catch(error => {
          console.error('LibraryPage: Error auto-refreshing songs:', error);
        });
      }, 60000); // Refresh every 60 seconds after the first one
    }, 60000); // Wait 60 seconds before first refresh

    return () => {
      isMounted = false;
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
    };
  }, [isFocused, fetchSongs]); // Re-run when focus changes to restart the timer

  const filteredSongs = songs
    .filter(song => {
      if (!searchQuery.trim()) return true; // Show all songs if search is empty
      
      const query = searchQuery.toLowerCase();
      // Handle both array and string formats for backward compatibility
      const artists = Array.isArray(song.artist) 
        ? song.artist 
        : (song.artist && typeof song.artist === 'string' ? [song.artist] : []);
      
      return (
        song.title.toLowerCase().includes(query) ||
        artists.some(artist => artist.toLowerCase().includes(query)) ||
        (song.key && song.key.toLowerCase().includes(query)) ||
        (song.tags && song.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    })
    .sort((a, b) => {
      // Sort alphabetically by title (case-insensitive)
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

  const toggleSelection = (songId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSongs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSongs.map(song => song.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    const message = `Are you sure you want to delete ${count} song${count > 1 ? 's' : ''}? This action cannot be undone.`;

    const confirmed = Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm
      ? window.confirm(message)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Delete Songs',
            message,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;

    setDeleting(true);
    try {
      // Delete all selected songs
      const deletePromises = Array.from(selectedIds).map(id => deleteSong(id));
      await Promise.all(deletePromises);
      
      // Clear selection and exit selection mode
      setSelectedIds(new Set());
      setSelectionMode(false);
      
      // Show success message
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Successfully deleted ${count} song${count > 1 ? 's' : ''}!`);
      } else {
        Alert.alert('Success', `Successfully deleted ${count} song${count > 1 ? 's' : ''}!`);
      }
    } catch (error: any) {
      console.error('Error deleting songs:', error);
      const errorMessage = error?.message || 'Failed to delete songs';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCardPress = (songId: string) => {
    if (selectionMode) {
      toggleSelection(songId);
    } else {
      navigation.navigate('SongViewer', { songId });
    }
  };

  const handleLongPress = (songId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([songId]));
    }
  };

  console.log('LibraryPage: Rendering, songs:', songs.length, 'loading:', loading);
  console.log('LibraryPage: Theme:', theme);
  console.log('LibraryPage: filteredSongs:', filteredSongs.length);
  
      return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
          <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
            <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Library</Text>
        {selectionMode ? (
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectAllButton, { backgroundColor: '#f0f9ff', borderColor: theme.primary }]}
              onPress={toggleSelectAll}
            >
              <Text style={[styles.selectAllButtonText, { color: theme.primary }]}>
                {selectedIds.size === filteredSongs.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            {selectedIds.size > 0 ? (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error }, ...(deleting ? [styles.deleteButtonDisabled] : [])]}
                onPress={handleDeleteSelected}
                disabled={deleting}
              >
                <Text style={[styles.deleteButtonText, { color: theme.errorText }]}>
                  {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setSelectionMode(true)}
          >
            <Text style={[styles.selectButtonText, { color: theme.primaryText }]}>Select</Text>
          </TouchableOpacity>
        )}
      </View>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      
      {loading ? (
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
      ) : filteredSongs.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No songs found</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {filteredSongs.map((song) => (
            <TouchableOpacity
              key={song.id}
              onPress={() => handleCardPress(song.id)}
              onLongPress={() => handleLongPress(song.id)}
              style={[
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                ...(selectionMode && selectedIds.has(song.id) ? [styles.cardSelected, { backgroundColor: theme.selected, borderColor: theme.selectedBorder }] : []),
              ]}
            >
              {selectionMode ? (
                <View style={[styles.checkbox, { borderColor: theme.primary }]}>
                  {selectedIds.has(song.id) ? (
                    <View style={[styles.checkboxChecked, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.checkmark, { color: theme.primaryText }]}>✓</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{song.title}</Text>
                {(() => {
                  // Handle both array and string formats for backward compatibility
                  const artists = Array.isArray(song.artist) 
                    ? song.artist 
                    : (song.artist && typeof song.artist === 'string' ? [song.artist] : []);
                  
                if (artists.length > 0) {
                  return (
                    <Text style={[styles.cardArtist, { color: theme.textSecondary }]}>
                      {artists.join(', ')}
                    </Text>
                  );
                } else {
                  return <Text style={[styles.cardArtist, { color: theme.textSecondary }]}>Unknown Artist</Text>;
                }
              })()}
              <View style={styles.cardTags}>
                {song.key && song.key.trim() ? (
                  <View style={[styles.tag, { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: theme.primary }]}>
                    <Text style={[styles.tagText, { color: theme.primary, fontWeight: '600' }]}>Key: {song.key}</Text>
                  </View>
                ) : null}
                {song.tags && song.tags.length > 0 ? song.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }]}>
                    <Text style={[styles.tagText, { color: '#374151' }]}>{tag}</Text>
                  </View>
                )) : null}
              </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
        onPress={() => navigation.navigate('AddSong')}
      >
        <Text style={[styles.addButtonText, { color: theme.primaryText }]}>+ Add Song</Text>
      </TouchableOpacity>
          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    padding: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'web' ? 24 : 80,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  card: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
    flexShrink: 1,
  },
  cardMain: {
    marginBottom: 8,
  },
      cardTitle: {
        fontSize: Platform.OS === 'web' ? 16 : 17,
        fontWeight: '600',
        marginBottom: 2,
        marginTop: 0,
      },
      cardArtist: {
        fontSize: Platform.OS === 'web' ? 12 : 13,
        marginBottom: 4,
      },
  artistsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 40,
  },
      pageTitle: {
        fontSize: Platform.OS === 'web' ? 20 : 22,
        fontWeight: 'bold',
        marginTop: 0,
        flex: 1,
      },
  selectButton: {
    padding: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cancelButton: {
    padding: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectAllButton: {
    padding: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardSelected: {
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007aff',
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007aff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    padding: Platform.OS === 'web' ? 12 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 24,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: Platform.OS === 'web' ? 16 : 12,
    marginBottom: Platform.OS === 'web' ? 16 : 80, // Extra space for bottom nav on mobile
    alignSelf: 'flex-start',
    minWidth: Platform.OS === 'web' ? 120 : 140,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

