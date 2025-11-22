import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Song } from '../types/Song';

interface SongCardProps {
  song: Song;
  onPress: () => void;
  onDelete?: () => void;
}

export function SongCard({ song, onPress, onDelete }: SongCardProps) {
  const handleDelete = (e?: any) => {
    console.log('SongCard: Delete button clicked for song:', song.id, song.title);
    if (e) {
      e.stopPropagation?.();
      e.preventDefault?.();
    }
    if (onDelete) {
      console.log('SongCard: Calling onDelete callback');
      onDelete();
    } else {
      console.warn('SongCard: onDelete callback not provided');
    }
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700">
      <View className="flex-row justify-between items-start mb-2">
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="flex-1">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            {song.title}
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {song.artist}
          </Text>
        </TouchableOpacity>
        <View className="ml-2 flex-row items-center gap-2">
          <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
            <Text className="text-xs font-semibold text-blue-800 dark:text-blue-200">
              {song.key}
            </Text>
          </View>
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded"
            >
              <Text className="text-xs font-semibold text-red-800 dark:text-red-200">
                🗑️
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View className="flex-row flex-wrap mt-2">
          <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2 mb-1">
            <Text className="text-xs text-gray-700 dark:text-gray-300">
              {song.type}
            </Text>
          </View>
          {song.tags.map((tag, index) => (
            <View
              key={index}
              className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded mr-2 mb-1"
            >
              <Text className="text-xs text-purple-800 dark:text-purple-200">
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </View>
  );
}

