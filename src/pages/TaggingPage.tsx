import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSongs } from '../../app/hooks/useSongs';
import { songApi } from '../../app/services/api';

const MUSICAL_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Extract song title from text
 * Only extracts if there's an explicit "Title:" or "Song:" pattern
 */
function extractTitleFromText(text: string): string | null {
  if (!text || !text.trim()) return null;

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return null;

  // Only look for explicit title patterns - be very conservative
  for (const line of lines.slice(0, 10)) {
    // Pattern: "Title: Song Name" or "Song: Song Name" or "Name: Song Name"
    const titleMatch = line.match(/^(?:title|song|name):\s*(.+)$/i);
    if (titleMatch && titleMatch[1]) {
      const extractedTitle = titleMatch[1].trim();
      // Validate it's not a chord line
      if (extractedTitle && 
          !extractedTitle.match(/^[A-G][b#]?[m|0-9\/\s]*$/) && // Not a chord
          extractedTitle.length > 2 && 
          extractedTitle.length < 100) {
        return extractedTitle;
      }
    }
  }

  return null;
}

export function TaggingPage() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { createSong } = useSongs();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [selectedKey, setSelectedKey] = useState('C');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [songText, setSongText] = useState('');

  // Get file or text from route params
  const fileUri = route.params?.fileUri;
  const fileType = route.params?.fileType;
  const initialText = route.params?.text || route.params?.extractedText || '';

  // Extract text from file if fileUri is provided
  useEffect(() => {
    const handleFileExtraction = async () => {
      if (!fileUri || !fileType) return;

      setExtracting(true);
      try {
        const result = await songApi.uploadAndExtract(fileUri, fileType);
        
        if (result && result.text) {
          const extractedText = result.text.trim();
          setSongText(extractedText);
          
          // Try to extract title from extracted text
          // Use functional update to check current title state
          setTitle(currentTitle => {
            if (!currentTitle.trim()) {
              const extractedTitle = extractTitleFromText(extractedText);
              if (extractedTitle) {
                return extractedTitle;
              }
            }
            return currentTitle;
          });
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

    if (fileUri && fileType) {
      handleFileExtraction();
    } else if (initialText) {
      setSongText(initialText);
      // Try to extract title from initial text
      const extractedTitle = extractTitleFromText(initialText);
      if (extractedTitle) {
        setTitle(extractedTitle);
      }
    }
  }, [fileUri, fileType, initialText]);

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

  const handleSave = async () => {
    // Title is mandatory
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a song title');
      return;
    }

    // Song text is mandatory
    if (!songText.trim()) {
      Alert.alert('Error', 'Please add song text');
      return;
    }

    setSaving(true);
    try {
      console.log('TaggingPage: Attempting to save song...');
      console.log('TaggingPage: Song data:', {
        title: title.trim(),
        artist: artist.trim() || '',
        type: 'chords',
        key: selectedKey || 'C',
        tags: tags || [],
        extractedTextLength: songText.trim().length,
      });

      const newSong = await createSong({
        title: title.trim(),
        artist: artist.trim() || '', // Provide empty string as default
        type: 'chords',
        key: selectedKey || 'C', // Provide default key
        tags: tags || [], // Provide empty array as default
        extractedText: songText.trim(),
      });

      console.log('TaggingPage: Song saved successfully:', newSong.id);

      // Show success message with song title
      Alert.alert(
        'Success',
        `Song "${title.trim()}" has been saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('TaggingPage: Navigating to Library');
              navigation.navigate('Library');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('TaggingPage: Save error:', error);
      console.error('TaggingPage: Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });

      // Extract detailed error message
      let errorMessage = 'Failed to save song. Please try again.';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid song data. Please check all fields.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      // Show error message
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tagging</Text>

      {extracting ? (
        <View style={styles.extractingContainer}>
          <ActivityIndicator size="small" color="#007aff" />
          <Text style={styles.extractingText}>Extracting text from file...</Text>
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

      {/* Artist - Optional */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Artist (optional)</Text>
        <TextInput
          value={artist}
          onChangeText={setArtist}
          style={styles.input}
          placeholder="Artist (optional)"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Key Selection - Optional */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Key (optional)</Text>
        <TextInput
          value={selectedKey}
          onChangeText={setSelectedKey}
          style={styles.input}
          placeholder="Key (e.g., D, G, A) - optional"
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
          placeholder="Tags (comma separated) - optional"
          placeholderTextColor="#9ca3af"
        />
      </View>
      {tags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, ...(saving ? [styles.saveButtonDisabled] : [])]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Song'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 0,
    marginBottom: 24,
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
  keyContainer: {
    flexDirection: 'row',
  },
  keyButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  keyButtonActive: {
    backgroundColor: '#007aff',
    borderColor: '#007aff',
  },
  keyText: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'normal',
  },
  keyTextActive: {
    color: 'white',
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
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  saveButtonDisabled: {
    backgroundColor: '#d0d0d0',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
  },
});

