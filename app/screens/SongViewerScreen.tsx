import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ChordTextView } from '../components/ChordTextView';
import { TransposeControls } from '../components/TransposeControls';
import { useTranspose } from '../hooks/useTranspose';
import { useSongs } from '../hooks/useSongs';
import { songApi } from '../services/api';
import { Song } from '../types/Song';

export function SongViewerScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { songId } = route.params;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const { deleteSong } = useSongs();

  const songText = song?.extractedText || '';
  const { text, transposeSteps, transposeUp, transposeDown, reset } = useTranspose(songText);

  useEffect(() => {
    loadSong();
  }, [songId]);

  const loadSong = async () => {
    try {
      setLoading(true);
      const loadedSong = await songApi.getById(songId);
      setSong(loadedSong);
    } catch (error) {
      console.error('Failed to load song:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!song) return;

    Alert.alert(
      'Delete Song',
      `Are you sure you want to delete "${song.title}" by ${song.artist}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Delete confirmed for song:', song.id, song.title);
              await deleteSong(song.id);
              console.log('Delete completed successfully, navigating back');
              // Navigate back to library/home
              navigation.navigate('Home');
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete song. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!song) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Text className="text-gray-500 dark:text-gray-400">Song not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className="bg-gray-100">
      {/* Purple Header */}
      <View className="bg-purple-600 px-6 py-4 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <Text className="text-white text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">{song.title}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <Text className="text-white text-xl">⋯</Text>
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
          {/* White Card with Song Details */}
          <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200 shadow-sm">
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {song.title}
            </Text>
            
            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">Artist</Text>
              <Text className="text-base text-gray-900">
                {song.artist || 'Unknown Artist'}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-gray-600 mb-1">Key</Text>
              <Text className="text-base text-gray-900">{song.key}</Text>
            </View>

            {song.tags.length > 0 && (
              <View className="mb-3">
                <Text className="text-sm text-gray-600 mb-2">Tags</Text>
                <View className="flex-row flex-wrap gap-2">
                  {song.tags.map((tag, index) => (
                    <View
                      key={index}
                      className="bg-purple-100 px-3 py-1 rounded-full"
                    >
                      <Text className="text-xs text-purple-800 font-medium">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Transpose Controls */}
          <View className="mb-4 flex-row items-center justify-between">
            <TransposeControls
              onTransposeUp={transposeUp}
              onTransposeDown={transposeDown}
              onReset={reset}
              transposeSteps={transposeSteps}
            />

            {/* Zoom Controls */}
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-medium text-gray-700">
                Font Size: {fontSize}px
              </Text>
              <TouchableOpacity
                onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                className="bg-gray-200 w-10 h-10 rounded-lg items-center justify-center"
              >
                <Text className="text-gray-700 text-lg font-bold">−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFontSize(Math.min(24, fontSize + 2))}
                className="bg-gray-200 w-10 h-10 rounded-lg items-center justify-center"
              >
                <Text className="text-gray-700 text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Song Text */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <ChordTextView text={text} fontSize={fontSize} />
          </View>
        </View>
      </View>
    </View>
  );
}

