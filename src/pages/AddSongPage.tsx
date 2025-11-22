import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform, useWindowDimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useSongs } from '../../app/hooks/useSongs';
import { useTheme } from '../../app/context/ThemeContext';
import { songApi } from '../../app/services/api';

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

/**
 * Extract song title from text
 * Only extracts if there's an explicit "Title:" pattern
 * Does NOT fall back to first line to avoid extracting lyrics as title
 */
function extractTitleFromText(text: string): string | null {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return null;

  // Only try to find explicit title patterns - don't fall back to first line
  // This prevents lyrics from being extracted as title
  for (const line of lines.slice(0, 15)) {
    // Pattern: "Title: Song Name" or "Song: Song Name" or "Name: Song Name"
    const titleMatch = line.match(/^(?:title|song|name):\s*(.+)$/i);
    if (titleMatch && titleMatch[1]) {
      const extractedTitle = titleMatch[1].trim();
      // Validate it's not a chord line and is reasonable length
      if (extractedTitle && 
          !extractedTitle.match(/^[A-G][b#]?[m|0-9\/\s]*$/) && // Not a chord
          extractedTitle.length > 2 && 
          extractedTitle.length < 100) {
        console.log('Extracted title from explicit pattern:', extractedTitle);
        return extractedTitle;
      }
    }
  }

  // Don't fall back to first/second/third line - only extract if explicit pattern found
  // This prevents lyrics from being autopopulated as title
  console.log('No explicit title pattern found, returning null');
  return null;
}

/**
 * Extract key from text
 * Looks for patterns like "Key: C" or "in C" or "Key of C"
 */
function extractKeyFromText(text: string): string | null {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Check first 15 lines for key information
  for (const line of lines.slice(0, 15)) {
    // Pattern: "Key: C" or "Key of C" or "in C" or "Key C"
    const keyMatch = line.match(/(?:^|\s)(?:key|in|of)\s*:?\s*([A-G][b#]?m?)(?:\s|$)/i);
    if (keyMatch && keyMatch[1]) {
      const extractedKey = keyMatch[1].trim();
      // Validate it's a valid key
      if (MUSICAL_KEYS.includes(extractedKey)) {
        return extractedKey;
      }
    }
  }

  return null;
}

export function AddSongPage() {
  const navigation = useNavigation<any>();
  const { createSong, fetchSongs } = useSongs();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  const insets = useSafeAreaInsets();

  const [selectedOption, setSelectedOption] = useState<'upload' | 'paste' | null>(null);
  const [title, setTitle] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [artists, setArtists] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [songText, setSongText] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const handleUploadFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedOption('upload');
        await handleFileExtraction(file.uri, file.mimeType || 'application/octet-stream');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFileExtraction = async (fileUri: string, fileType: string) => {
    setExtracting(true);
    try {
      const result = await songApi.uploadAndExtract(fileUri, fileType);
      
      if (result && result.text) {
        const extractedText = result.text.trim();
        setSongText(extractedText);
        
        // Always update title from extracted text (even if already populated)
        const extractedTitle = extractTitleFromText(extractedText);
        if (extractedTitle) {
          setTitle(extractedTitle);
        } else {
          // If no title found, clear the field
          setTitle('');
        }
        
        // Always update key from extracted text (even if already populated)
        const extractedKey = extractKeyFromText(extractedText);
        if (extractedKey) {
          setSelectedKey(extractedKey);
        } else {
          // If no key found, clear the field
          setSelectedKey('');
        }
      } else {
        Alert.alert('Warning', 'No text could be extracted from the file.');
      }
    } catch (error: any) {
      console.error('File extraction error:', error);
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to extract text from file');
    } finally {
      setExtracting(false);
    }
  };

  const handlePaste = () => {
    setSelectedOption('paste');
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddArtist = () => {
    const trimmed = artistInput.trim();
    if (trimmed && !artists.includes(trimmed)) {
      setArtists([...artists, trimmed]);
      setArtistInput('');
    }
  };

  const handleRemoveArtist = (artistToRemove: string) => {
    setArtists(artists.filter(artist => artist !== artistToRemove));
  };

  // Auto-extract title and key when text is pasted or manually entered
  // Only auto-populate if fields are empty (for paste/manual, not for upload)
  useEffect(() => {
    if (songText.trim() && selectedOption !== 'upload') {
      // Only auto-populate if fields are empty (don't overwrite user input)
      if (!title.trim()) {
        const extractedTitle = extractTitleFromText(songText);
        if (extractedTitle) {
          setTitle(extractedTitle);
        }
      }
      
      if (!selectedKey.trim()) {
        const extractedKey = extractKeyFromText(songText);
        if (extractedKey) {
          setSelectedKey(extractedKey);
        }
      }
    }
  }, [songText, selectedOption]);

  const handleSave = async () => {
    // Title is mandatory
    if (!title.trim()) {
      const errorMsg = 'Song title is required. Please enter a song title.';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(errorMsg);
      } else {
        Alert.alert('Missing Required Field', errorMsg);
      }
      return;
    }

    // Song text is mandatory
    if (!songText.trim()) {
      const errorMsg = 'Song text is required. Please add lyrics or chords.';
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(errorMsg);
      } else {
        Alert.alert('Missing Required Field', errorMsg);
      }
      return;
    }

    setSaving(true);
    try {
      console.log('AddSongPage: Attempting to save song...');
      console.log('AddSongPage: Song data:', {
        title: title.trim(),
        artist: artists || [],
        type: 'chords',
        key: selectedKey || '',
        tags: tags || [],
        extractedTextLength: songText.trim().length,
      });

      const newSong = await createSong({
        title: title.trim(),
        artist: artists || [],
        type: 'chords',
        key: selectedKey.trim() || '',
        tags: tags || [],
        extractedText: songText.trim(),
      });

      console.log('AddSongPage: Song saved successfully:', newSong.id);

      // Trigger a refresh to ensure the new song appears in all lists
      // This helps other platforms see the new song faster (they'll also get it via auto-refresh)
      // The useFocusEffect on LibraryPage will also refresh when we navigate there
      try {
        await fetchSongs();
        console.log('AddSongPage: Songs list refreshed after creating new song');
      } catch (refreshError) {
        console.error('AddSongPage: Error refreshing songs list:', refreshError);
        // Don't block navigation if refresh fails
      }

      // Show success message with song title
      const successMsg = `Song "${title.trim()}" has been saved successfully!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(successMsg);
        // Navigate after alert is dismissed
        setTimeout(() => {
          console.log('AddSongPage: Navigating to Library');
          navigation.navigate('Library');
        }, 100);
      } else {
        Alert.alert(
          'Success',
          successMsg,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('AddSongPage: Navigating to Library');
                navigation.navigate('Library');
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('AddSongPage: Save error:', error);
      console.error('AddSongPage: Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });

      // Extract detailed error message with specific handling for mandatory fields
      let errorMessage = 'Failed to save song. Please try again.';
      let errorTitle = 'Error';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        // Check if it's a mandatory field error
        if (errorMessage.toLowerCase().includes('title') && errorMessage.toLowerCase().includes('required')) {
          errorTitle = 'Missing Required Field';
          errorMessage = 'Song title is required. Please enter a song title.';
        } else if (errorMessage.toLowerCase().includes('text') && errorMessage.toLowerCase().includes('required')) {
          errorTitle = 'Missing Required Field';
          errorMessage = 'Song text is required. Please add lyrics or chords.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
        // Check if it's a mandatory field error from frontend validation
        if (errorMessage.toLowerCase().includes('title') && errorMessage.toLowerCase().includes('required')) {
          errorTitle = 'Missing Required Field';
          errorMessage = 'Song title is required. Please enter a song title.';
        } else if (errorMessage.toLowerCase().includes('text') && errorMessage.toLowerCase().includes('required')) {
          errorTitle = 'Missing Required Field';
          errorMessage = 'Song text is required. Please add lyrics or chords.';
        }
      } else if (error?.response?.status === 400) {
        errorTitle = 'Invalid Data';
        errorMessage = 'Invalid song data. Please check all required fields are filled.';
      } else if (error?.response?.status === 500) {
        errorTitle = 'Server Error';
        errorMessage = 'Server error. Please try again later.';
      } else if (error?.request) {
        errorTitle = 'Network Error';
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      }

      // Show error message
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`${errorTitle}: ${errorMessage}`);
      } else {
        Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setSaving(false);
    }
  };

      return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={[styles.container, { padding: Platform.OS === 'web' ? 24 : 12, paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top), paddingBottom: Platform.OS === 'web' ? 24 : 100 }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.title, { color: theme.text }]}>Add Song</Text>

      {/* Option Cards */}
      <View style={styles.optionsContainer}>
        {/* Upload File Card */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 2 }]}
          onPress={handleUploadFile}
        >
          <Text style={[styles.optionTitle, { color: theme.primary, fontWeight: '600' }]}>📁 Upload File (JPG, PDF, DOC, TXT)</Text>
        </TouchableOpacity>

        {/* Paste Lyrics/Chords Card */}
        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.primary, borderWidth: 2 }]}
          onPress={handlePaste}
        >
          <Text style={[styles.optionTitle, { color: theme.primary, fontWeight: '600' }]}>📋 Paste Lyrics/Chords</Text>
        </TouchableOpacity>
      </View>

      {/* Extraction Status */}
      {extracting ? (
        <View style={styles.extractingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.extractingText, { color: theme.textSecondary }]}>Extracting text from file...</Text>
        </View>
      ) : null}


      {/* Song Title - Mandatory */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Song Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Song Title (required)"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Artists - Optional */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Artists (optional)</Text>
        <TextInput
          value={artistInput}
          onChangeText={setArtistInput}
          onSubmitEditing={handleAddArtist}
          style={styles.input}
          placeholder="Artists (type and press Enter) - optional"
          placeholderTextColor="#9ca3af"
        />
        {artists.length > 0 ? (
          <View style={styles.tagsContainer}>
            {artists.map((artist, index) => (
              <View key={index} style={[styles.tagChip, { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: theme.primary }]}>
                <Text style={[styles.tagText, { color: theme.primary, fontWeight: '500' }]}>{artist}</Text>
                <TouchableOpacity onPress={() => handleRemoveArtist(artist)}>
                  <Text style={[styles.tagRemove, { color: theme.error, fontSize: 18 }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Key Selection - Optional */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Key (optional)</Text>
        <TextInput
          value={selectedKey}
          onChangeText={setSelectedKey}
          style={styles.input}
          placeholder="Key (e.g., C, D, G) - optional"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Tags Input - Optional */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tags (optional)</Text>
        <TextInput
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={handleAddTag}
          style={styles.input}
          placeholder="Tags (type and press Enter) - optional"
          placeholderTextColor="#9ca3af"
        />
        {tags.length > 0 ? (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={[styles.tagChip, { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' }]}>
                <Text style={[styles.tagText, { color: '#374151', fontWeight: '500' }]}>{tag}</Text>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <Text style={[styles.tagRemove, { color: theme.error, fontSize: 18 }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Song Text - Always visible for paste or after upload */}
      {(selectedOption === 'paste' || selectedOption === 'upload' || songText.trim()) ? (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Song Text <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            value={songText}
            onChangeText={setSongText}
            multiline
            scrollEnabled={true}
            style={styles.textArea}
            placeholder={selectedOption === 'paste' ? "Paste your lyrics/chords here..." : "Song lyrics/chords (required)"}
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
          />
        </View>
      ) : null}

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: theme.primary, borderColor: theme.primary },
          saving && styles.saveButtonDisabled
        ]}
        onPress={handleSave}
        disabled={saving}
      >
            <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>{saving ? 'Saving...' : 'Save Song'}</Text>
          </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
      optionCard: {
        borderRadius: 8,
        borderWidth: 1,
        padding: Platform.OS === 'web' ? 16 : 18,
        marginBottom: Platform.OS === 'web' ? 12 : 14,
      },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  extractingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginBottom: 16,
  },
  extractingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: 'white',
    fontSize: 14,
    color: '#000',
  },
  textArea: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: 'white',
    fontSize: 14,
    color: '#000',
    minHeight: Platform.OS === 'web' ? 200 : 250,
    maxHeight: Platform.OS === 'web' ? 600 : 400, // Limit max height so ScrollView can handle scrolling
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#eee',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 12,
    color: '#000',
    marginRight: 6,
  },
  tagRemove: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    padding: Platform.OS === 'web' ? 12 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: Platform.OS === 'web' ? 12 : 16,
    marginBottom: Platform.OS === 'web' ? 24 : 80, // Extra space for bottom nav on mobile
    alignSelf: 'flex-start',
  },
  saveButtonDisabled: {
    backgroundColor: '#d0d0d0',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
