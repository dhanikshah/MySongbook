import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';

interface TagSelectorProps {
  tags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
}

export function TagSelector({
  tags,
  selectedTags,
  onTagsChange,
  suggestions = [],
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onTagsChange([...selectedTags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const availableSuggestions = suggestions.filter(
    s => !selectedTags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Tags
      </Text>
      
      {/* Selected Tags */}
      <View className="flex-row flex-wrap mb-2">
        {selectedTags.map((tag, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => removeTag(tag)}
            className="bg-purple-500 dark:bg-purple-600 px-3 py-1 rounded-full mr-2 mb-2 flex-row items-center"
          >
            <Text className="text-white text-sm mr-2">{tag}</Text>
            <Text className="text-white text-sm font-bold">×</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <TextInput
        value={inputValue}
        onChangeText={setInputValue}
        onSubmitEditing={handleSubmit}
        placeholder="Add a tag..."
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        placeholderTextColor="#9CA3AF"
      />

      {/* Suggestions */}
      {inputValue && availableSuggestions.length > 0 ? (
        <ScrollView className="max-h-32 mt-2">
          {availableSuggestions.slice(0, 5).map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => addTag(suggestion)}
              className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded mb-1"
            >
              <Text className="text-gray-700 dark:text-gray-300">{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

