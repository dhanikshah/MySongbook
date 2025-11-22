import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { songApi } from '../services/api';
import { isSupportedFileType } from '../utils/ocr';

interface FileUploaderProps {
  onFileSelected: (fileUri: string, fileType: string) => void;
  onTextExtracted?: (text: string) => void;
  onError?: (error: string) => void;
}

export function FileUploader({
  onFileSelected,
  onTextExtracted,
  onError,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        console.log('Document picked:', file.uri, 'MIME type:', file.mimeType);
        handleFile(file.uri, file.mimeType || 'application/octet-stream');
      } else {
        console.log('Document picker canceled');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      onError?.('Failed to pick document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log('Image picked:', asset.uri, 'Type:', asset.type);
        // Use the actual mime type if available
        const mimeType = asset.type === 'image' ? (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg') : 'image/jpeg';
        handleFile(asset.uri, mimeType);
      } else {
        console.log('Image picker canceled');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      onError?.('Failed to pick image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleFile = async (fileUri: string, fileType: string) => {
    console.log('handleFile called with:', { fileUri, fileType });
    
    if (!isSupportedFileType(fileType)) {
      const errorMsg = 'Unsupported file type. Please use PDF, JPG, PNG, DOCX, or TXT.';
      console.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setUploading(true);
    onFileSelected?.(fileUri, fileType);

    try {
      console.log('Calling uploadAndExtract with:', { fileUri, fileType });
      const result = await songApi.uploadAndExtract(fileUri, fileType);
      console.log('Extraction result:', { 
        hasText: !!result.text, 
        textLength: result.text?.length || 0,
        preview: result.text?.substring(0, 100) 
      });
      
      console.log('Full result object:', JSON.stringify(result, null, 2));
      console.log('Result type:', typeof result);
      console.log('Result.text exists:', !!result?.text);
      console.log('Result.text value:', result?.text);
      
      if (result && result.text) {
        const extractedText = result.text;
        console.log('✅ Extraction successful!');
        console.log('Text length:', extractedText.length);
        console.log('Text type:', typeof extractedText);
        console.log('Text preview (first 200 chars):', extractedText.substring(0, 200));
        
        if (extractedText && typeof extractedText === 'string' && extractedText.trim()) {
          console.log('✅ Text is valid, calling onTextExtracted callback...');
          console.log('onTextExtracted function exists:', typeof onTextExtracted === 'function');
          
          // Call the callback
          if (onTextExtracted && typeof onTextExtracted === 'function') {
            try {
              console.log('Calling onTextExtracted with text length:', extractedText.length);
              onTextExtracted(extractedText);
              console.log('✅ onTextExtracted callback executed successfully');
            } catch (error) {
              console.error('❌ Error calling onTextExtracted:', error);
              onError?.('Error processing extracted text: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          } else {
            console.error('❌ onTextExtracted callback is not defined or not a function!');
            console.error('onTextExtracted type:', typeof onTextExtracted);
            onError?.('Text extracted but callback not available');
          }
        } else {
          const errorMsg = 'No text could be extracted from the file. Please try another file or enter text manually.';
          console.warn('❌ Text is empty or invalid:', { extractedText, type: typeof extractedText });
          onError?.(errorMsg);
        }
      } else {
        const errorMsg = 'No text returned from server. Please try another file or enter text manually.';
        console.warn('❌ No text in result:', result);
        onError?.(errorMsg);
      }
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to extract text from file';
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={pickDocument}
        disabled={uploading}
        className="items-center"
      >
        <View className="bg-purple-100 rounded-lg p-6 mb-2">
          {uploading ? (
            <ActivityIndicator color="#9333EA" size="large" />
          ) : (
            <Text className="text-purple-600 text-4xl">📄</Text>
          )}
        </View>
        <Text className="text-gray-900 font-medium">Upload File</Text>
        <Text className="text-gray-500 text-xs mt-1">(PDF, JPG, DOC, TXT)</Text>
      </TouchableOpacity>
      
      {/* Hidden image picker option - can be triggered programmatically if needed */}
      {typeof window !== 'undefined' && (
        <View style={{ display: 'none' }}>
          <TouchableOpacity onPress={pickImage} />
        </View>
      )}
    </View>
  );
}

