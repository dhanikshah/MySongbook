import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, useWindowDimensions, StatusBar, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { songApi } from '../../app/services/api';
import { Song } from '../../app/types/Song';
import { transposeSongText, CHORD_PATTERN } from '../../app/utils/chordTranspose';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

export function SongViewerPage() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { songId } = route.params;
  const { updateSong, deleteSong } = useSongs();
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transposeSteps, setTransposeSteps] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const DEFAULT_FONT_SIZE = 16;
  const [isEditing, setIsEditing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(10); // pixels per second
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const [editingTitle, setEditingTitle] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [editingArtists, setEditingArtists] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);
  const [editingText, setEditingText] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSong();
  }, [songId]);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSong();
    } catch (error) {
      console.error('SongViewerPage: Error refreshing song:', error);
    } finally {
      setRefreshing(false);
    }
  }, [songId]);

  const loadSong = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedSong = await songApi.getById(songId);
      
      // Log the loaded song data for debugging
      console.log('SongViewerPage: Loaded song:', {
        id: loadedSong.id,
        title: loadedSong.title,
        extractedTextLength: loadedSong.extractedText ? loadedSong.extractedText.length : 0,
        extractedTextPreview: loadedSong.extractedText ? loadedSong.extractedText.substring(0, 100) : '(empty)',
        extractedTextIsNull: loadedSong.extractedText === null,
        extractedTextIsUndefined: loadedSong.extractedText === undefined,
        extractedTextType: typeof loadedSong.extractedText,
      });
      
      // Ensure extractedText is always a string
      if (!loadedSong.extractedText) {
        console.warn('SongViewerPage: Song has no extractedText!', loadedSong.id);
        loadedSong.extractedText = '';
      }
      
      setSong(loadedSong);
      // Initialize edit fields
          setEditingTitle(loadedSong.title);
          setEditingArtists(Array.isArray(loadedSong.artist) ? loadedSong.artist : (loadedSong.artist ? [loadedSong.artist] : []));
          setEditingKey(loadedSong.key || '');
          setEditingTags(loadedSong.tags || []);
          setEditingText(loadedSong.extractedText || '');
    } catch (error: any) {
      console.error('Failed to load song:', error);
      
      // Check if it's a 404 (song not found)
      if (error?.response?.status === 404 || error?.message?.includes('404')) {
        setError('Song not found. It may have been deleted.');
        setSong(null);
        
        // Auto-navigate back to Library after 2 seconds
        setTimeout(() => {
          navigation.navigate('Library');
        }, 2000);
      } else {
        setError(error?.message || 'Failed to load song. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
      // Reset to original values
      if (song) {
        setEditingTitle(song.title);
        setEditingArtists(Array.isArray(song.artist) ? song.artist : (song.artist ? [song.artist] : []));
        setEditingKey(song.key || '');
        setEditingTags(song.tags || []);
      }
      setArtistInput('');
      setTagInput('');
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !editingTags.includes(trimmed)) {
      setEditingTags([...editingTags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddArtist = () => {
    const trimmed = artistInput.trim();
    if (trimmed && !editingArtists.includes(trimmed)) {
      setEditingArtists([...editingArtists, trimmed]);
      setArtistInput('');
    }
  };

  const handleRemoveArtist = (artistToRemove: string) => {
    setEditingArtists(editingArtists.filter(artist => artist !== artistToRemove));
  };

  const handleSave = async () => {
    if (!song) return;

    if (!editingTitle.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }

    if (!editingText.trim()) {
      Alert.alert('Error', 'Please enter song text');
      return;
    }

    setSaving(true);
    try {
      const trimmedKey = editingKey.trim();
      console.log('SongViewerPage: Saving song with data:', {
        title: editingTitle.trim(),
        artist: editingArtists || [],
        key: trimmedKey || '',
        tags: editingTags,
      });

      const updated = await updateSong(song.id, {
        title: editingTitle.trim(),
        artist: editingArtists || [],
        key: trimmedKey || '',
        tags: editingTags,
        extractedText: editingText.trim(),
      });

      console.log('SongViewerPage: Song updated successfully:', updated);
      console.log('SongViewerPage: Updated key:', updated.key);
      console.log('SongViewerPage: Updated artist:', updated.artist);

      setSong(updated);
      setIsEditing(false);

      // Show success message
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert('Song updated successfully!');
      } else {
        Alert.alert('Success', 'Song updated successfully!', [{ text: 'OK' }]);
      }

      // Note: LibraryPage will automatically refresh when navigated to
      // because it uses useFocusEffect to refetch songs
    } catch (error: any) {
      console.error('Update error:', error);
      console.error('Update error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      Alert.alert('Error', error?.message || 'Failed to update song');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!song) {
      console.error('SongViewerPage: Cannot delete - song is null');
      return;
    }

    const songId = song.id;
    const songTitle = song.title;

    console.log('SongViewerPage: Delete button clicked');
    console.log('Song ID:', songId);
    console.log('Song Title:', songTitle);

    // Use window.confirm for web, Alert.alert for mobile
    const performDelete = async () => {
      try {
        console.log('=== DELETE SONG START ===');
        console.log('Song ID:', songId);
        console.log('Song Title:', songTitle);
        
        // Delete the song from database
        console.log('SongViewerPage: Calling deleteSong...');
        await deleteSong(songId);
        
        console.log('=== DELETE SONG SUCCESS ===');
        console.log('SongViewerPage: Delete successful, navigating to Library...');
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Navigate back to Library immediately
        navigation.navigate('Library');
      } catch (error: any) {
        console.error('=== DELETE SONG ERROR ===');
        console.error('Error type:', typeof error);
        console.error('Error:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        if (error?.response) {
          console.error('Error response status:', error.response.status);
          console.error('Error response data:', error.response.data);
        }
        
        // Show error message
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert(`Error: ${error?.message || 'Failed to delete song. Please try again.'}`);
        } else {
          Alert.alert('Error', error?.message || 'Failed to delete song. Please try again.');
        }
      }
    };

    // Show confirmation dialog
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`Are you sure you want to delete "${songTitle}"? This action cannot be undone.`);
      if (confirmed) {
        console.log('SongViewerPage: Delete confirmed by user (web)');
        performDelete();
      } else {
        console.log('SongViewerPage: Delete cancelled by user (web)');
      }
    } else {
      Alert.alert(
        'Delete Song',
        `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('SongViewerPage: Delete cancelled by user (mobile)');
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleTransposeUp = () => {
    setTransposeSteps(prev => prev + 1);
  };

  const handleTransposeDown = () => {
    setTransposeSteps(prev => prev - 1);
  };

  const handleReset = () => {
    setTransposeSteps(0);
    setFontSize(DEFAULT_FONT_SIZE);
    setAutoScroll(false);
    setScrollSpeed(10);
  };

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || !scrollViewRef.current) return;

    const interval = setInterval(() => {
      scrollPositionRef.current += scrollSpeed / 10; // Update every 100ms
      scrollViewRef.current?.scrollTo({
        y: scrollPositionRef.current,
        animated: true,
      });
    }, 100);

    return () => clearInterval(interval);
  }, [autoScroll, scrollSpeed]);

  // Reset scroll position when auto-scroll is toggled off
  useEffect(() => {
    if (!autoScroll) {
      scrollPositionRef.current = 0;
    }
  }, [autoScroll]);

  const getCurrentKey = () => {
    if (!song) return '';
    // Simple key transposition - in a real app, you'd parse the key and transpose it
    return song.key || '';
  };

  const getTransposedText = () => {
    if (!song) {
      console.warn('SongViewerPage: getTransposedText called but song is null');
      return '';
    }
    if (!song.extractedText) {
      console.warn('SongViewerPage: getTransposedText called but song.extractedText is empty/null', {
        songId: song.id,
        extractedText: song.extractedText,
        extractedTextType: typeof song.extractedText,
      });
      return '';
    }
    if (transposeSteps === 0) return song.extractedText;
    return transposeSongText(song.extractedText, transposeSteps);
  };

  /**
   * Render text with chords highlighted in a different color
   */
  const renderTextWithChords = (text: string) => {
    if (!text || text.trim() === '') {
      return (
        <View style={styles.emptyLyricsContainer}>
          <Text style={[styles.emptyLyricsText, { color: theme.textSecondary }]}>
            No lyrics available
          </Text>
          <Text style={[styles.emptyLyricsHint, { color: theme.textSecondary }]}>
            Click "Edit" to add lyrics
          </Text>
        </View>
      );
    }

    const parts: Array<{ text: string; isChord: boolean }> = [];
    let lastIndex = 0;
    let match;

    // Reset regex to start from beginning
    const regex = new RegExp(CHORD_PATTERN.source, CHORD_PATTERN.flags);
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the chord
      if (match.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, match.index),
          isChord: false,
        });
      }
      
      // Add the chord
      parts.push({
        text: match[0],
        isChord: true,
      });
      
      lastIndex = regex.lastIndex;
    }
    
    // Add remaining text after last chord
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        isChord: false,
      });
    }

    // If no chords found, return plain text
    if (parts.length === 0 || (parts.length === 1 && !parts[0].isChord)) {
      return <Text style={[styles.lyricsText, { fontSize }]}>{text}</Text>;
    }

    // Render with styled chords
    return (
      <Text style={[styles.lyricsText, { fontSize, color: theme.text }]}>
        {parts.map((part, index) => (
          <Text
            key={index}
            style={part.isChord ? [styles.chordText, { fontSize, color: theme.primary }] : undefined}
          >
            {part.text}
          </Text>
        ))}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!song && !loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
        <Text style={[styles.errorText, { color: theme.error, fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }]}>
          {error || 'Song not found'}
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary, fontSize: 14, marginBottom: 24, textAlign: 'center' }]}>
          The song may have been deleted or doesn't exist.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={() => navigation.navigate('Library')}
        >
          <Text style={[styles.backButtonText, { color: theme.primaryText }]}>Back to Library</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top) }]}>
      {isEditing ? (
        /* Edit Mode */
        <ScrollView style={[styles.editContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.editTitle, { color: theme.text }]}>Edit Song</Text>

          {/* Title */}
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: theme.text }]}>
              Song Title <Text style={[styles.required, { color: theme.error }]}>*</Text>
            </Text>
            <TextInput
              value={editingTitle}
              onChangeText={setEditingTitle}
              style={[styles.editInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Song Title (required)"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Artists */}
          <View style={styles.editField}>
            <Text style={styles.editLabel}>Artists (optional)</Text>
            <TextInput
              value={artistInput}
              onChangeText={setArtistInput}
              onSubmitEditing={handleAddArtist}
              style={styles.editInput}
              placeholder="Artists (type and press Enter) - optional"
              placeholderTextColor="#9ca3af"
            />
            {editingArtists.length > 0 ? (
              <View style={styles.tagsContainer}>
                {editingArtists.map((artist, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{artist}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveArtist(artist)}
                      hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                    >
                      <Text style={styles.tagRemove}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noTagsText}>No artists added. Type an artist and press Enter to add.</Text>
            )}
          </View>

          {/* Key */}
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: theme.text }]}>Key (optional)</Text>
            <TextInput
              value={editingKey}
              onChangeText={(text) => {
                console.log('Key input changed:', text);
                setEditingKey(text);
              }}
              style={[styles.editInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Key (e.g., C, D, G) - optional"
              placeholderTextColor={theme.textSecondary}
              editable={true}
            />
            <Text style={[styles.hintText, { color: theme.textSecondary }]}>Type the musical key (e.g., C, D, G, Am, etc.)</Text>
          </View>

          {/* Tags */}
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: theme.text }]}>Tags (optional)</Text>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              style={[styles.editInput, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Tags (type and press Enter) - optional"
              placeholderTextColor={theme.textSecondary}
            />
            {editingTags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {editingTags.map((tag, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }]}>
                    <Text style={[styles.tagText, { color: '#374151', fontWeight: '500' }]}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveTag(tag)}
                      style={styles.tagRemoveButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[styles.tagRemove, { color: theme.error, fontSize: 18 }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noTagsText, { color: theme.textSecondary }]}>No tags added. Type a tag and press Enter to add.</Text>
            )}
          </View>

          {/* Song Text */}
          <View style={styles.editField}>
            <Text style={[styles.editLabel, { color: theme.text }]}>
              Song Text <Text style={[styles.required, { color: theme.error }]}>*</Text>
            </Text>
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              multiline
              scrollEnabled={true}
              style={[styles.editTextArea, { backgroundColor: theme.input, borderColor: theme.inputBorder, color: theme.text }]}
              placeholder="Song lyrics/chords (required)"
              placeholderTextColor={theme.textSecondary}
              textAlignVertical="top"
            />
          </View>

          {/* Save/Cancel Buttons */}
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.primary, borderColor: theme.primary },
                saving && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              onPress={handleCancelEdit}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* View Mode */
        <>
          {/* Edit and Delete Buttons */}
          {!isEditing ? (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={handleEdit}>
                <Text style={[styles.editButtonText, { color: theme.primaryText }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.error, borderColor: theme.error }]} onPress={handleDelete}>
                <Text style={[styles.deleteButtonText, { color: theme.errorText }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Title and Artist */}
          <View style={styles.header}>
            <Text style={[styles.songTitle, { color: theme.text }]}>{song.title}</Text>
            {song.artist && Array.isArray(song.artist) && song.artist.length > 0 ? (
              <Text style={[styles.songArtist, { color: theme.textSecondary }]}>{song.artist.join(', ')}</Text>
            ) : song.artist && typeof song.artist === 'string' ? (
              <Text style={[styles.songArtist, { color: theme.textSecondary }]}>{song.artist}</Text>
            ) : (
              <Text style={[styles.songArtist, { color: theme.textSecondary }]}>Unknown Artist</Text>
            )}
            {song.tags && song.tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {song.tags.map((tag, index) => (
                  <View key={index} style={[styles.tagChip, { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }]}>
                    <Text style={[styles.tagText, { color: '#374151' }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={handleTransposeDown}
        >
          <Text style={[styles.actionButtonText, { color: theme.primaryText }]}>Transpose -</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
          onPress={handleTransposeUp}
        >
          <Text style={[styles.actionButtonText, { color: theme.primaryText }]}>Transpose +</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fontSizeButton, { backgroundColor: '#f0f9ff', borderColor: theme.primary, borderWidth: 1 }]}
          onPress={() => setFontSize(Math.max(12, fontSize - 2))}
        >
          <Text style={[styles.fontSizeButtonText, { color: theme.primary }]}>Font -</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fontSizeButton, { backgroundColor: '#f0f9ff', borderColor: theme.primary, borderWidth: 1 }]}
          onPress={() => setFontSize(Math.min(24, fontSize + 2))}
        >
          <Text style={[styles.fontSizeButtonText, { color: theme.primary }]}>Font +</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={handleReset}
        >
          <Text style={[styles.resetButtonText, { color: theme.textSecondary }]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.autoScrollButton,
            { backgroundColor: autoScroll ? theme.primary : theme.surface, borderColor: autoScroll ? theme.primary : theme.border, borderWidth: 1 }
          ]}
          onPress={() => setAutoScroll(!autoScroll)}
        >
          <Text style={[styles.autoScrollButtonText, { color: autoScroll ? theme.primaryText : theme.text }]}>
            Auto Scroll
          </Text>
        </TouchableOpacity>
      </View>

      {/* Speed Control (only shown when auto-scroll is active) */}
      {autoScroll ? (
        <View style={styles.speedControl}>
          <Text style={[styles.speedLabel, { color: theme.textSecondary }]}>Speed:</Text>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={() => setScrollSpeed(Math.max(10, scrollSpeed - 10))}
          >
            <Text style={styles.speedButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.speedValue, { color: theme.text }]}>{scrollSpeed}</Text>
          <TouchableOpacity
            style={styles.speedButton}
            onPress={() => setScrollSpeed(Math.min(200, scrollSpeed + 10))}
          >
            <Text style={styles.speedButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Lyrics/Chords Area */}
      <ScrollView
        ref={scrollViewRef}
        style={[
          styles.lyricsContainer, 
          { 
            backgroundColor: theme.surface,
            height: Platform.OS === 'android' 
              ? Math.max(200, height - insets.top - insets.bottom - 100) // Maximized: extends to bottom menu bar (reserved ~100px for header/buttons, min 200px)
              : (Platform.OS === 'web' ? undefined : Math.max(200, height - insets.top - insets.bottom - 100))
          }
        ]}
        contentContainerStyle={styles.lyricsContent}
        onScroll={(event) => {
          scrollPositionRef.current = event.nativeEvent.contentOffset.y;
        }}
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
        {renderTextWithChords(getTransposedText())}
      </ScrollView>

        </>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 12,
    paddingBottom: Platform.OS === 'web' ? 24 : 0, // No bottom padding on Android to maximize lyrics box
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 32,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 32,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    padding: Platform.OS === 'web' ? 12 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 24,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: Platform.OS === 'web' ? 16 : 17,
    fontWeight: '600',
  },
  header: {
    marginBottom: Platform.OS === 'android' ? 2 : 4,
    marginTop: 0,
  },
  songTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 2,
  },
  songArtist: {
    fontSize: 12,
    marginBottom: 4,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 12 : 6,
    marginBottom: Platform.OS === 'web' ? 8 : 4,
  },
  actionButton: {
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 13,
    color: '#000',
  },
  keyTag: {
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  keyTagText: {
    fontSize: 12,
    color: '#000',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontSizeButton: {
    padding: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: Platform.OS === 'web' ? 12 : 14,
    borderRadius: 6,
  },
  fontSizeButtonText: {
    fontSize: Platform.OS === 'web' ? 13 : 14,
    fontWeight: '600',
  },
  resetButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  autoScrollButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  autoScrollButtonActive: {
    // Active styles applied via inline styles
  },
  autoScrollButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  autoScrollButtonTextActive: {
    // Active text styles applied via inline styles
  },
  speedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Platform.OS === 'android' ? 2 : 8,
    paddingHorizontal: 4,
  },
  speedLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  speedButton: {
    padding: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  speedButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  speedValue: {
    fontSize: 13,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
  fontSizeLabel: {
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  lyricsContainer: {
    flex: Platform.OS === 'web' ? 1 : 0, // Use flex on web, fixed height on mobile
    minHeight: Platform.OS === 'web' ? 400 : undefined, // Only set minHeight on web
    marginTop: Platform.OS === 'web' ? 8 : 4, // Minimized top margin on Android
    marginBottom: 0, // No bottom margin to maximize space
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: Platform.OS === 'web' ? 15 : (Platform.OS === 'android' ? 8 : 12), // Reduced padding on Android
  },
  lyricsContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'web' ? 20 : 40, // Extra padding for scrolling
  },
  lyricsText: {
    fontFamily: 'monospace',
    color: '#000',
    lineHeight: 20,
    fontSize: 14,
    backgroundColor: '#f4f4f4',
    padding: 12,
    borderRadius: 6,
  },
  chordText: {
    // Color applied via inline styles using theme.primary
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Platform.OS === 'android' ? 8 : 12,
    marginBottom: Platform.OS === 'android' ? 2 : 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 16,
  },
  editButton: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007aff',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  editContainer: {
    flex: 1,
  },
  editTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  editField: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    // Color applied via inline styles
  },
  editInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
  },
  editTextArea: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
    minHeight: Platform.OS === 'web' ? 200 : 250,
    maxHeight: Platform.OS === 'web' ? 600 : 400,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tagChip: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    marginRight: 4,
  },
  tagRemoveButton: {
    padding: 2,
    marginLeft: 4,
  },
  tagRemove: {
    fontWeight: 'bold',
    lineHeight: 18,
  },
  noTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  saveButton: {
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007aff',
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyLyricsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLyricsText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyLyricsHint: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

