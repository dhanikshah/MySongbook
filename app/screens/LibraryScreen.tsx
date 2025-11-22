import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSongs } from '../hooks/useSongs';
import { useSearch } from '../hooks/useSearch';
import { SongCard } from '../components/SongCard';
import { SongType } from '../types/Song';

const SONG_TYPES: SongType[] = ['lyrics', 'chords', 'tabs'];
const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm',
];

export function LibraryScreen() {
  const navigation = useNavigation<any>();
  const { songs, loading, deleteSong, fetchSongs, refetch } = useSongs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<SongType | undefined>();
  const [selectedKey, setSelectedKey] = useState<string | undefined>();

  const filteredSongs = useSearch(songs, {
    query: searchQuery,
    type: selectedType,
    key: selectedKey,
  });

  const allTags = Array.from(new Set(songs.flatMap(s => s.tags)));

  const handleDelete = (songId: string, songTitle: string) => {
    console.log('handleDelete function called with:', songId, songTitle);
    
    // Perform the actual delete
    const performDelete = async () => {
      try {
        console.log('=== DELETE INITIATED ===');
        console.log('Song ID:', songId);
        console.log('Song Title:', songTitle);
        
        // Delete the song
        console.log('LibraryScreen: Calling deleteSong with ID:', songId);
        await deleteSong(songId);
        console.log('LibraryScreen: deleteSong promise resolved');
        
        // The useSongs hook should have already updated local state
        // But let's also refetch to ensure UI is in sync
        console.log('LibraryScreen: Current songs count before refetch:', songs.length);
        
        // Small delay to ensure state has updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Refetch to ensure UI is updated
        await refetch();
        
        console.log('LibraryScreen: Refetch completed');
        console.log('=== DELETE COMPLETE ===');
      } catch (error) {
        console.error('=== DELETE FAILED ===');
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete song. Please try again.';
        
        // Show error - use window.alert for web, Alert.alert for mobile
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };
    
    // Use window.confirm for web, Alert.alert for mobile
    if (typeof window !== 'undefined' && window.confirm) {
      // Web: use window.confirm
      const confirmed = window.confirm(`Are you sure you want to delete "${songTitle}"? This action cannot be undone.`);
      if (confirmed) {
        performDelete();
      } else {
        console.log('Delete cancelled by user');
      }
    } else {
      // Mobile: use Alert.alert
      Alert.alert(
        'Delete Song',
        `Are you sure you want to delete "${songTitle}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              console.log('Delete cancelled by user');
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

  return (
    <View className="flex-1 bg-gray-100">
      {/* Purple Header */}
      <View className="bg-purple-600 px-6 py-4 flex-row justify-between items-center">
        <Text className="text-white text-xl font-bold">My Songbook</Text>
        <TouchableOpacity>
          <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
            <Text className="text-purple-600 text-lg">👤</Text>
          </View>
        </TouchableOpacity>
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
        <View className="flex-1 bg-white p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">
            Browse Library
          </Text>

          {/* Search Bar */}
          <View className="mb-4">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by title, artist, or text..."
              className="border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Filters */}
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row items-center gap-2">
                {/* Type Filter */}
                <Text className="text-sm font-medium text-gray-700 mr-1">Type:</Text>
                {SONG_TYPES.map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedType(selectedType === type ? undefined : type)}
                    className={`px-3 py-2 rounded-lg ${
                      selectedType === type
                        ? 'bg-purple-600'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${selectedType === type ? 'text-white' : 'text-gray-700'}`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Key Filter */}
                <Text className="text-sm font-medium text-gray-700 ml-4 mr-1">Key:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {MUSICAL_KEYS.slice(0, 12).map(key => (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setSelectedKey(selectedKey === key ? undefined : key)}
                        className={`px-3 py-2 rounded-lg ${
                          selectedKey === key
                            ? 'bg-purple-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`font-semibold text-sm ${
                            selectedKey === key
                              ? 'text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          {key}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </ScrollView>
          </View>

          {/* Song List */}
          <ScrollView>
            {loading ? (
              <Text className="text-gray-500 text-center py-8">
                Loading...
              </Text>
            ) : filteredSongs.length === 0 ? (
              <Text className="text-gray-500 text-center py-8">
                No songs found
              </Text>
            ) : (
              <>
                <Text className="text-sm text-gray-600 mb-4">
                  {filteredSongs.length} song{filteredSongs.length !== 1 ? 's' : ''} found
                </Text>
                {filteredSongs.map((song, index) => (
                  <TouchableOpacity
                    key={song.id}
                    onPress={() => navigation.navigate('SongViewer', { songId: song.id })}
                    className="py-4 border-b border-gray-200 flex-row items-center justify-between"
                  >
                    <View className="flex-1 flex-row items-center">
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-base mb-1">
                          {song.title}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {song.artist || 'Unknown Artist'}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mr-4">
                        <View className="bg-purple-100 px-2 py-1 rounded">
                          <Text className="text-purple-800 text-xs font-semibold">
                            {song.key}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            handleDelete(song.id, song.title);
                          }}
                          className="bg-red-100 px-2 py-1 rounded"
                        >
                          <Text className="text-red-800 text-xs">🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-purple-600 text-xl ml-4">›</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

