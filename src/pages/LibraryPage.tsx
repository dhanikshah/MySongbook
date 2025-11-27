import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, useWindowDimensions, SafeAreaView, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';
import { Song } from '../../app/types/Song';

export function LibraryPage() {
  const navigation = useNavigation<any>();
  const { songs, loading, fetchSongs, deleteSong } = useSongs();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const letterRefs = useRef<{ [letter: string]: number }>({});
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Calculate ScrollView height for mobile to extend to bottom menu bar
  // Account for: top inset, container padding top (12px), header (~50px), letter jump bar (~30px), container padding bottom (80px), bottom nav (60px), bottom inset
  // Bottom nav is absolutely positioned, so we need to account for it in the ScrollView height
  const scrollViewHeight = isMobile 
    ? Math.max(200, height - insets.top - insets.bottom - 12 - 50 - 30 - 60) // Maximized: extends to bottom menu bar (account for all UI elements, min 200px)
    : undefined;

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

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSongs();
    } catch (error) {
      console.error('LibraryPage: Error refreshing songs:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSongs]);

  // Group songs by first letter
  const songsByLetter = useMemo(() => {
    const sortedSongs = [...songs].sort((a, b) => {
      // Sort alphabetically by title (case-insensitive)
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    const grouped: { [letter: string]: Song[] } = {};
    sortedSongs.forEach(song => {
      const firstChar = song.title.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(song);
    });
    return grouped;
  }, [songs]);

  // Get all letters that have songs, sorted
  const letters = useMemo(() => {
    const allLetters = Object.keys(songsByLetter).sort();
    // Put # at the end if it exists
    const hashIndex = allLetters.indexOf('#');
    if (hashIndex > -1) {
      allLetters.splice(hashIndex, 1);
      allLetters.push('#');
    }
    return allLetters;
  }, [songsByLetter]);

  // Get total count of songs
  const totalSongs = songs.length;

  // Scroll to a specific letter
  const scrollToLetter = (letter: string) => {
    const yPosition = letterRefs.current[letter];
    if (yPosition !== undefined && scrollViewRef.current) {
      setActiveLetter(letter);
      scrollViewRef.current.scrollTo({ y: yPosition, animated: true });
      // Reset active letter after animation
      setTimeout(() => setActiveLetter(null), 1000);
    }
  };

  // Handle scroll to update active letter
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    let currentLetter: string | null = null;
    
    // Find which letter section is currently visible
    // Check letters in reverse order to get the topmost visible one
    for (let i = letters.length - 1; i >= 0; i--) {
      const letter = letters[i];
      const letterY = letterRefs.current[letter];
      if (letterY !== undefined && scrollY >= letterY - 100) {
        currentLetter = letter;
        break;
      }
    }
    
    if (currentLetter !== activeLetter) {
      setActiveLetter(currentLetter);
    }
  };

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
    const allSongIds = new Set(songs.map(song => song.id));
    if (selectedIds.size === allSongIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allSongIds);
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
                {selectedIds.size === totalSongs ? 'Deselect All' : 'Select All'}
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

      {/* Letter Jump Bar */}
      {!loading && letters.length > 0 && (
        <View style={styles.letterJumpBar}>
          {letters.map((letter) => {
            const isActive = activeLetter === letter;
            return (
              <TouchableOpacity
                key={letter}
                onPress={() => scrollToLetter(letter)}
                style={[
                  styles.letterButton,
                  isActive && { backgroundColor: theme.primary }
                ]}
              >
                <Text style={[
                  styles.letterButtonText,
                  { color: isActive ? (theme.primaryText || '#ffffff') : theme.primary }
                ]}>
                  {letter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      
      {loading ? (
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
      ) : totalSongs === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No songs in library</Text>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={[
            styles.scrollView,
            isMobile && scrollViewHeight ? { height: scrollViewHeight } : undefined
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }
        >
          {letters.map((letter) => {
            const letterSongs = songsByLetter[letter] || [];
            if (letterSongs.length === 0) return null;

            return (
              <View
                key={letter}
                onLayout={(event) => {
                  const { y } = event.nativeEvent.layout;
                  letterRefs.current[letter] = y;
                }}
              >
                {/* Letter Header */}
                <View style={[
                  styles.letterHeader, 
                  { 
                    backgroundColor: activeLetter === letter ? theme.primary : theme.surface,
                    borderBottomColor: activeLetter === letter ? theme.primary : theme.border,
                    borderLeftColor: theme.primary,
                    borderLeftWidth: 4,
                  }
                ]}>
                  <Text style={[
                    styles.letterHeaderText, 
                    { 
                      color: activeLetter === letter 
                        ? (theme.primaryText || '#ffffff') 
                        : theme.primary,
                      fontWeight: 'bold',
                    }
                  ]}>
                    {letter} ({letterSongs.length})
                  </Text>
                </View>

                {/* Songs in this letter - Grid View */}
                <View style={styles.gridContainer}>
                  {letterSongs.map((song) => (
                    <TouchableOpacity
                      key={song.id}
                      onPress={() => handleCardPress(song.id)}
                      onLongPress={() => handleLongPress(song.id)}
                      style={[
                        styles.gridCard,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        ...(selectionMode && selectedIds.has(song.id) ? [styles.cardSelected, { backgroundColor: theme.selected, borderColor: theme.selectedBorder }] : []),
                      ]}
                    >
                      {selectionMode ? (
                        <View style={[styles.checkbox, { borderColor: theme.primary, position: 'absolute', top: 8, right: 8, zIndex: 1 }]}>
                          {selectedIds.has(song.id) ? (
                            <View style={[styles.checkboxChecked, { backgroundColor: theme.primary }]}>
                              <Text style={[styles.checkmark, { color: theme.primaryText }]}>✓</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                      <View style={styles.gridCardContent}>
                        <Text 
                          style={[styles.gridCardTitle, { color: theme.text }]}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {song.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
      
      {!isMobile && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => navigation.navigate('AddSong')}
        >
          <Text style={[styles.addButtonText, { color: theme.primaryText }]}>+ Add Song</Text>
        </TouchableOpacity>
      )}
          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : { minHeight: '100%' }),
    padding: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'web' ? 24 : 0, // No bottom padding on mobile - bottom nav overlays content
  },
  scrollView: {
    flex: Platform.OS === 'web' ? 1 : 0, // Use flex on web, fixed height on mobile
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    position: 'relative',
    ...(Platform.OS === 'web' ? {
      width: '31%',
      minWidth: 200,
      maxWidth: '31%',
    } : {
      width: '48%',
      minWidth: 150,
      maxWidth: '48%',
    }),
  },
  gridCardContent: {
    flex: 1,
  },
  gridCardTitle: {
    fontSize: Platform.OS === 'web' ? 15 : 16,
    fontWeight: '600',
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
  letterJumpBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
    gap: 4,
  },
  letterButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  letterButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  letterHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  letterHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

