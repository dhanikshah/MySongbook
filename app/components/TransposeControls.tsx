import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TransposeControlsProps {
  onTransposeUp: () => void;
  onTransposeDown: () => void;
  onReset?: () => void;
  transposeSteps: number;
}

export function TransposeControls({
  onTransposeUp,
  onTransposeDown,
  onReset,
  transposeSteps,
}: TransposeControlsProps) {

  return (
    <View className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg p-3 mb-4">
      <View className="flex-row items-center">
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
          Transpose:
        </Text>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {transposeSteps > 0 ? `+${transposeSteps}` : transposeSteps}
        </Text>
      </View>
      
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onTransposeDown}
          className="bg-red-500 dark:bg-red-600 w-10 h-10 rounded-lg items-center justify-center"
        >
          <Text className="text-white text-xl font-bold">−</Text>
        </TouchableOpacity>
        
        {onReset && (
          <TouchableOpacity
            onPress={onReset}
            className="bg-gray-500 dark:bg-gray-600 w-10 h-10 rounded-lg items-center justify-center"
          >
            <Text className="text-white text-sm font-semibold">0</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={onTransposeUp}
          className="bg-green-500 dark:bg-green-600 w-10 h-10 rounded-lg items-center justify-center"
        >
          <Text className="text-white text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

