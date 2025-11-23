import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform, useWindowDimensions, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SearchBar } from '../components/SearchBar';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function SearchPage() {
  const navigation = useNavigation<any>();
  const { songs, fetchSongs } = useSongs();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();
  const filtersContainerRef = useRef<View>(null);
  const [filtersHeight, setFiltersHeight] = useState(200); // Default estimate
  
  // Calculate results ScrollView height for mobile to extend to bottom menu bar
  // Account for: top inset, container padding top (12px), page title (~40px), search bar (~50px), filters (measured dynamically), results title (~30px), bottom nav (60px), bottom inset
  // Bottom nav is absolutely positioned, so we need to account for it in the ScrollView height
  const resultsScrollViewHeight = isMobile 
    ? Math.max(200, height - insets.top - insets.bottom - 12 - 40 - 50 - filtersHeight - 30 - 60) // Maximized: extends to bottom menu bar (account for all UI elements, min 200px)
    : undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh songs when page comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('SearchPage: Page focused, fetching songs...');
      fetchSongs().catch(error => {
        console.error('SearchPage: Error fetching songs:', error);
      });
    }, [fetchSongs])
  );

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchSongs();
    } catch (error) {
      console.error('SearchPage: Error refreshing songs:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchSongs]);

  const allTags = Array.from(new Set(songs.flatMap(s => s.tags || []))).sort();
  const allArtists = Array.from(new Set(
    songs.flatMap(s => {
      if (Array.isArray(s.artist)) {
        return s.artist;
      } else if (s.artist && typeof s.artist === 'string') {
        return [s.artist];
      }
      return [];
    })
  )).sort();
  const allKeys = Array.from(new Set(songs.map(s => s.key).filter(key => key && key.trim()))).sort();

  const toggleKey = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleArtist = (artist: string) => {
    setSelectedArtists(prev =>
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedArtists([]);
    setSelectedKeys([]);
    setSearchQuery('');
  };

  const filteredSongs = songs.filter(song => {
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      // Handle artist as array or string (for backward compatibility)
      const artists = Array.isArray(song.artist) 
        ? song.artist 
        : (song.artist && typeof song.artist === 'string' ? [song.artist] : []);
      
      if (
        !song.title.toLowerCase().includes(query) &&
        !artists.some(artist => artist.toLowerCase().includes(query)) &&
        !song.tags.some(tag => tag.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Key filter - song must match at least one of the selected keys
    if (selectedKeys.length > 0) {
      const songKey = song.key?.trim() || '';
      if (!selectedKeys.includes(songKey)) {
        return false;
      }
    }

    // Tag filter - song must have at least one of the selected tags
    if (selectedTags.length > 0) {
      const songTags = song.tags || [];
      if (!selectedTags.some(tag => songTags.includes(tag))) {
        return false;
      }
    }

    // Artist filter - song must match at least one of the selected artists
    if (selectedArtists.length > 0) {
      const songArtists = Array.isArray(song.artist) ? song.artist : (song.artist ? [song.artist] : []);
      if (!selectedArtists.some(artist => songArtists.includes(artist))) {
        return false;
      }
    }

    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Search</Text>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search..." />

        <View 
          ref={filtersContainerRef}
          onLayout={(event) => {
            if (isMobile) {
              const { height: measuredHeight } = event.nativeEvent.layout;
              setFiltersHeight(measuredHeight);
            }
          }}
          style={[styles.filtersContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.filtersHeader}>
          <Text style={[styles.filtersTitle, { color: theme.text }]}>Filters</Text>
          {(selectedTags.length > 0 || selectedArtists.length > 0 || selectedKeys.length > 0 || searchQuery.trim()) ? (
            <TouchableOpacity onPress={clearFilters} style={[styles.clearButton, { backgroundColor: '#fee2e2', borderColor: theme.error }]}>
              <Text style={[styles.clearButtonText, { color: theme.error }]}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* All Tags List */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Tags ({allTags.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedTags.includes(tag) && [styles.filterChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: theme.text },
                  selectedTags.includes(tag) && [styles.filterChipTextActive, { color: theme.primaryText }]
                ]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedTags.length > 0 ? (
            <Text style={styles.selectedCount}>Selected: {selectedTags.length} tag(s)</Text>
          ) : null}
        </View>

        {/* All Artists List */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Artists ({allArtists.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {allArtists.map(artist => (
              <TouchableOpacity
                key={artist}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedArtists.includes(artist) && [styles.filterChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                ]}
                onPress={() => toggleArtist(artist)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: theme.text },
                  selectedArtists.includes(artist) && [styles.filterChipTextActive, { color: theme.primaryText }]
                ]}>
                  {artist}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedArtists.length > 0 ? (
            <Text style={styles.selectedCount}>Selected: {selectedArtists.length} artist(s)</Text>
          ) : null}
        </View>

        {/* All Keys List */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Keys ({allKeys.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {allKeys.map(key => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  selectedKeys.includes(key) && [styles.filterChipActive, { backgroundColor: theme.primary, borderColor: theme.primary }]
                ]}
                onPress={() => toggleKey(key)}
              >
                <Text style={[
                  styles.filterChipText,
                  { color: theme.text },
                  selectedKeys.includes(key) && [styles.filterChipTextActive, { color: theme.primaryText }]
                ]}>
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedKeys.length > 0 ? (
            <Text style={styles.selectedCount}>Selected: {selectedKeys.length} key(s)</Text>
          ) : null}
        </View>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
        <Text style={[styles.resultsTitle, { color: theme.text }]}>
          Results{filteredSongs.length > 0 ? ` (${filteredSongs.length})` : ''}
        </Text>
        <ScrollView 
          style={[
            styles.resultsScrollView,
            isMobile && resultsScrollViewHeight ? { height: resultsScrollViewHeight } : undefined
          ]}
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
          {filteredSongs.length === 0 ? (
            <Text style={styles.noResultsText}>
              {selectedTags.length > 0 || selectedArtists.length > 0 || selectedKeys.length > 0 || searchQuery.trim()
                ? 'No songs match your filters'
                : 'Select tags, artists, or keys to filter songs'}
            </Text>
          ) : (
            filteredSongs.map(song => (
              <TouchableOpacity
                key={song.id}
                onPress={() => navigation.navigate('SongViewer', { songId: song.id })}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.cardTitle, { color: theme.text }]}>{song.title}</Text>
                {song.artist && Array.isArray(song.artist) && song.artist.length > 0 ? (
                  <Text style={[styles.cardArtist, { color: theme.textSecondary }]}>{song.artist.join(', ')}</Text>
                ) : song.artist && typeof song.artist === 'string' ? (
                  <Text style={[styles.cardArtist, { color: theme.textSecondary }]}>{song.artist}</Text>
                ) : (
                  <Text style={[styles.cardArtist, { color: theme.textSecondary }]}>Unknown Artist</Text>
                )}
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
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'web' ? 24 : 0, // No bottom padding on mobile - bottom nav overlays content
  },
  filtersContainer: {
    borderRadius: 8,
        padding: Platform.OS === 'web' ? 12 : 10,
        marginBottom: Platform.OS === 'web' ? 12 : 10,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 0,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  chipsContainer: {
    marginBottom: 4,
  },
  selectedCount: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    fontSize: 14,
    color: '#000',
  },
  applyButton: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#000',
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  filterChipActive: {
    // Active styles applied via inline styles
  },
  filterChipText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'normal',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    marginTop: 0,
  },
      resultsScrollView: {
        flex: Platform.OS === 'web' ? 1 : 0, // Use flex on web, fixed height on mobile
        paddingBottom: Platform.OS === 'web' ? 0 : 20, // Extra space for bottom nav on mobile
      },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
    fontSize: 15,
    fontStyle: 'italic',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 0,
    marginBottom: 8,
  },
      card: {
        borderRadius: 8,
        borderWidth: 1,
        padding: Platform.OS === 'web' ? 12 : 14,
        marginBottom: Platform.OS === 'web' ? 10 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#000',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    marginTop: 0,
  },
  cardArtist: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
});

