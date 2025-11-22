import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FileUploader } from '../components/FileUploader';
import { TagSelector } from '../components/TagSelector';
import { useSongs } from '../hooks/useSongs';
import { SongType } from '../types/Song';

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];

const SONG_TYPES: SongType[] = ['lyrics', 'chords', 'tabs'];

const TAG_SUGGESTIONS = [
  'Worship', 'Pop', 'Rock', 'Jazz', 'Blues', 'Country', 'Folk', 'Classical',
  'Guitar', 'Piano', 'Acoustic', 'Electric', 'Favorite', 'Practice',
];

export function AddSongScreen() {
  const navigation = useNavigation<any>();
  const { createSong } = useSongs();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState<SongType>('chords');
  const [key, setKey] = useState('C');
  const [tags, setTags] = useState<string[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  /**
   * Extract song title from text
   * Only extracts if there's an explicit "Title:" or "Song:" pattern
   * Does NOT extract chord lines or ambiguous first lines
   */
  const extractTitleFromText = (text: string): string | null => {
    if (!text || !text.trim()) return null;

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return null;

    // Only look for explicit title patterns - be very conservative
    for (const line of lines.slice(0, 10)) { // Check first 10 lines
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

    // Do NOT extract from first line if it looks like chords or is ambiguous
    // Only extract if there's a clear explicit pattern
    return null;
  };

  // Debug: Log when extractedText changes
  React.useEffect(() => {
    console.log('🔍 extractedText state changed, new length:', extractedText.length);
    console.log('🔍 extractedText value:', extractedText.substring(0, 100) + (extractedText.length > 100 ? '...' : ''));
  }, [extractedText]);

  const handleTextExtracted = React.useCallback((text: string) => {
    console.log('=== handleTextExtracted CALLED ===');
    console.log('Text received:', text);
    console.log('Text type:', typeof text);
    console.log('Text length:', text?.length || 0);
    console.log('Text preview:', text?.substring(0, 100) || 'null');
    
    if (!text || typeof text !== 'string') {
      console.warn('Invalid text received:', text);
      setExtracting(false);
      Alert.alert('Warning', 'No text could be extracted from the file.');
      return;
    }
    
    const trimmedText = text.trim();
    
    if (!trimmedText) {
      console.warn('Empty text after trim');
      setExtracting(false);
      Alert.alert('Warning', 'No text could be extracted from the file.');
      return;
    }
    
    console.log('Setting extractedText state, length:', trimmedText.length);
    
    // Extract title from text if title is empty
    // Use functional update to get current title value
    setTitle(currentTitle => {
      if (!currentTitle.trim()) {
        const extractedTitle = extractTitleFromText(trimmedText);
        if (extractedTitle) {
          console.log('Auto-extracted title:', extractedTitle);
          return extractedTitle;
        }
      }
      return currentTitle; // Keep current title if it exists or extraction failed
    });
    
    // Force state update - use functional update to ensure it works
    setExtractedText(() => {
      console.log('State setter called with:', trimmedText.substring(0, 50) + '...');
      return trimmedText;
    });
    setExtracting(false);
    
    // Verify state was set
    setTimeout(() => {
      console.log('State verification - extractedText should be updated now');
    }, 100);
    
    console.log('State update initiated');
    
    // Show success message
    const lineCount = trimmedText.split('\n').length;
    const extractedTitle = extractTitleFromText(trimmedText);
    
    // Get current title to check if we should show message
    // We need to check title state, but we can't read it synchronously
    // So we'll show the message if we extracted a title
    const titleMsg = extractedTitle
      ? `\n\nSong title has been auto-populated: "${extractedTitle}"`
      : '';
    Alert.alert('Success', `Text extracted from file (${lineCount} lines)!${titleMsg}\n\nThe text has been populated in the song text field below.`);
  }, []);

  const handleExtractionStart = () => {
    setExtracting(true);
  };

  const handleExtractionError = (error: string) => {
    setExtracting(false);
    Alert.alert('Error', error);
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('Form data:', { title, artist, type, key, tags, textLength: extractedText.length });
    
    if (!title.trim()) {
      Alert.alert('Error', 'Please fill in song title');
      return;
    }

    if (!extractedText.trim()) {
      Alert.alert('Error', 'Please add song text or upload a file');
      return;
    }

    setSaving(true);
    try {
      console.log('Calling createSong with:', {
        title: title.trim(),
        artist: artist.trim(),
        type,
        key,
        tags,
        extractedTextLength: extractedText.trim().length,
      });
      
      const newSong =       await createSong({
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        type,
        key: key || 'C',
        tags: tags || [],
        extractedText: extractedText.trim(),
      });
      
      console.log('Song created successfully:', newSong.id);
      
      Alert.alert('Success', 'Song saved!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Save error:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save song';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Purple Header */}
      <View className="bg-purple-600 px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Text className="text-white text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Add Song</Text>
      </View>

      <View className="flex-1 flex-row">
        {/* Left Sidebar */}
        <View className="w-64 bg-white border-r border-gray-200 p-4">
          <TouchableOpacity
            onPress={() => navigation.navigate('AddSong')}
            className="flex-row items-center mb-3 py-2"
          >
            <Text className="text-purple-600 text-xl mr-3">+</Text>
            <Text className="text-gray-900 font-medium">Add New Song</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Library')}
            className="flex-row items-center mb-3 py-2"
          >
            <Text className="text-purple-600 text-xl mr-3">📁</Text>
            <Text className="text-gray-900 font-medium">Browse Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Library')}
            className="flex-row items-center py-2"
          >
            <Text className="text-purple-600 text-xl mr-3">🔍</Text>
            <Text className="text-gray-900 font-medium">Search by Tags</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView className="flex-1 bg-white p-6">
          {/* White Card Container */}
          <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200 shadow-sm">
            {/* File Upload Section */}
            <View className="mb-6 items-center">
              <FileUploader
                onFileSelected={handleExtractionStart}
                onTextExtracted={handleTextExtracted}
                onError={handleExtractionError}
              />
            </View>

            {extracting && (
              <View className="mb-4">
                <Text className="text-gray-600 text-sm text-center">
                  Extracting lyrics/chords...
                </Text>
              </View>
            )}

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Song title"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Artist */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Artist
              </Text>
              <TextInput
                value={artist}
                onChangeText={setArtist}
                placeholder="Artist name (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Type and Key - Side by Side */}
            <View className="flex-row gap-3 mb-4">
              {/* Song Type */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Song Type
                </Text>
                <View className="border border-gray-300 rounded-lg bg-white">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row px-2 py-2">
                      {SONG_TYPES.map(t => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setType(t)}
                          className={`px-3 py-1 rounded ${
                            type === t
                              ? 'bg-purple-600'
                              : 'bg-gray-100'
                          } mr-2`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              type === t ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Key */}
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Key
                </Text>
                <View className="border border-gray-300 rounded-lg bg-white">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row px-2 py-2">
                      {MUSICAL_KEYS.slice(0, 12).map(k => (
                        <TouchableOpacity
                          key={k}
                          onPress={() => setKey(k)}
                          className={`px-3 py-1 rounded ${
                            key === k
                              ? 'bg-purple-600'
                              : 'bg-gray-100'
                          } mr-2`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              key === k ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {k}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Notes (Tags) */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Notes
              </Text>
              <TagSelector
                tags={TAG_SUGGESTIONS}
                selectedTags={tags}
                onTagsChange={setTags}
                suggestions={TAG_SUGGESTIONS}
              />
            </View>

            {/* Song Text */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Song Text *
              </Text>
              <TextInput
                value={extractedText}
                onChangeText={setExtractedText}
                placeholder="Paste or type song lyrics/chords here, or upload a file above to auto-populate..."
                multiline
                numberOfLines={10}
                textAlignVertical="top"
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 min-h-[200px]"
                placeholderTextColor="#9CA3AF"
                style={{ fontFamily: 'monospace' }}
              />
              {extractedText.trim() ? (
                <Text className="text-xs text-green-600 mt-1">
                  ✓ {extractedText.split('\n').length} lines loaded
                </Text>
              ) : null}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-purple-600 rounded-lg px-6 py-4 items-center mb-4"
          >
            <Text className="text-white text-lg font-semibold">
              {saving ? 'Saving...' : 'Save Song'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

