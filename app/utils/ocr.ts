/**
 * OCR utility for extracting text from images
 * This is a client-side wrapper; actual OCR happens on backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface OCRResult {
  text: string;
  confidence?: number;
}

/**
 * Extract text from file using backend OCR service
 */
export async function extractTextFromFile(fileUri: string, fileType: string): Promise<OCRResult> {
  try {
    const formData = new FormData();
    
    // For React Native, we need to handle file differently
    const file = {
      uri: fileUri,
      type: fileType,
      name: fileUri.split('/').pop() || 'file',
    } as any;
    
    formData.append('file', file);
    
    const response = await axios.post<OCRResult>(`${API_BASE_URL}/api/ocr`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from file');
  }
}

/**
 * Check if file type is supported for OCR
 */
export function isSupportedFileType(fileType: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'text/plain',
    'text/txt', // Alternative MIME type
  ];
  
  // Normalize file type for comparison
  const normalizedType = fileType.toLowerCase().trim();
  
  // Check for exact match or starts with
  return supportedTypes.some(type => {
    const normalizedSupported = type.toLowerCase();
    return normalizedType === normalizedSupported || 
           normalizedType.startsWith(normalizedSupported) ||
           normalizedType.includes(normalizedSupported.split('/')[1]);
  });
}

