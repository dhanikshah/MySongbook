/**
 * API service for backend communication
 */

import axios from 'axios';
import { Song, CreateSongDto, UpdateSongDto } from '../types/Song';
import { autoDetectApiUrl, getLocalIPFromExpo } from '../utils/autoDetectApiUrl';

// Get API URL - handle web vs mobile automatically
const getApiBaseUrl = () => {
  // CRITICAL: Check for Android physical device FIRST, before environment variable
  // This ensures physical devices always use the configured IP
  // Note: In React Native, window might be defined, so we check Platform directly
  try {
    console.log('🔍 Checking platform...');
    const ReactNative = require('react-native');
    const Platform = ReactNative?.Platform;
    
    if (Platform && Platform.OS === 'android') {
      console.log('🔍 Platform.OS: android');
      console.log('🔍 Platform.constants.model:', Platform.constants?.model);
      
      // Check if it's an emulator
      const isEmulator = Platform.isTV || 
                        (Platform.constants?.systemName === 'Android' && 
                         (Platform.constants?.model?.includes('sdk') || 
                          Platform.constants?.model?.includes('Emulator') ||
                          Platform.constants?.model?.includes('Android SDK')));
      
      console.log('🔍 isEmulator:', isEmulator);
      
      if (!isEmulator) {
        // This is a physical Android device - ALWAYS use configured IP (ignore env var)
        console.log('✅ Android physical device detected, using configured IP: 192.168.5.24:3001');
        return 'http://192.168.5.24:3001';
      } else {
        // Android emulator - use 10.0.2.2
        console.log('✅ Android emulator detected, using 10.0.2.2');
        return 'http://10.0.2.2:3001';
      }
    } else if (Platform && Platform.OS === 'ios') {
      console.log('🔍 Platform.OS: ios');
    } else {
      console.log('🔍 Platform.OS:', Platform?.OS || 'unknown');
    }
  } catch (e) {
    console.warn('⚠️ Could not detect platform:', e);
  }

  // If explicitly set via environment variable, use it (for web/emulator)
  if (process.env.EXPO_PUBLIC_API_URL) {
    console.log('Using API URL from environment:', process.env.EXPO_PUBLIC_API_URL);
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Auto-detect platform and use appropriate URL
  if (typeof window !== 'undefined') {
    // Web: use localhost
    console.log('Detected web platform, using localhost');
    return 'http://localhost:3001';
  }

  // Mobile: detect platform (lazy load to avoid issues during module initialization)
  try {
    // Dynamically import Platform to avoid issues during module initialization
    const ReactNative = require('react-native');
    const Platform = ReactNative?.Platform;
    
    if (Platform && Platform.OS === 'android') {
      // Check if running on emulator or physical device
      const isEmulator = Platform.isTV || 
                        (Platform.constants?.systemName === 'Android' && 
                         (Platform.constants?.model?.includes('sdk') || 
                          Platform.constants?.model?.includes('Emulator') ||
                          Platform.constants?.model?.includes('Android SDK')));
      
      if (isEmulator) {
        // Android emulator uses 10.0.2.2 to access host machine's localhost
        console.log('Detected Android emulator, using 10.0.2.2');
        return 'http://10.0.2.2:3001';
      } else {
        // Physical Android device - use configured IP
        console.log('Detected Android physical device, using configured IP: 192.168.5.24:3001');
        return 'http://192.168.5.24:3001';
      }
    } else if (Platform && Platform.OS === 'ios') {
      // iOS simulator can access localhost directly
      console.log('Detected iOS platform, using localhost');
      return 'http://localhost:3001';
    } else {
      console.warn('Platform detected but OS unknown, defaulting to localhost');
    }
  } catch (e) {
    // Platform not available (shouldn't happen, but handle gracefully)
    console.warn('Could not detect platform, using localhost fallback:', e?.message || e);
  }

  // Fallback
  console.log('Using fallback API URL: localhost:3001');
  return 'http://localhost:3001';
};

// Auto-detect server URL for physical Android devices
const getAutoDetectedServerUrl = (): string => {
  // First, try to get IP from Expo dev server
  const expoIP = getLocalIPFromExpo();
  if (expoIP) {
    console.log('Using Expo dev server IP for API:', expoIP);
    return `http://${expoIP}:3001`;
  }

  // Fallback to configured server IP
  console.log('Auto-detection: Using configured server IP');
  return 'http://192.168.5.24:3001';
};

let API_BASE_URL = getApiBaseUrl();
let isAutoDetecting = false;
let autoDetectionPromise: Promise<string | null> | null = null;

console.log('API Base URL (initial):', API_BASE_URL);

// Auto-detect API URL for physical Android devices
// Note: For production builds, we use the configured IP directly
// Auto-detection is disabled to avoid connection delays
if (false && (API_BASE_URL.includes('192.168.1.100') || API_BASE_URL.includes('192.168.5.24')) && typeof window === 'undefined') {
  // This is likely a physical Android device with fallback IP
  // Start auto-detection in background
  autoDetectionPromise = autoDetectApiUrl().then(detectedUrl => {
    if (detectedUrl) {
      API_BASE_URL = detectedUrl;
      api.defaults.baseURL = `${API_BASE_URL}/api`;
      console.log('✅ Updated API Base URL to:', API_BASE_URL);
    }
    return detectedUrl;
  }).catch(error => {
    console.warn('Auto-detection failed:', error);
    return null;
  });
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging and auto-detection retry
api.interceptors.request.use(
  async (config) => {
    // If we're still auto-detecting and this is the first request, wait for it
    if (autoDetectionPromise && !isAutoDetecting) {
      isAutoDetecting = true;
      try {
        const detectedUrl = await autoDetectionPromise;
        if (detectedUrl) {
          // Update the base URL for this request
          config.baseURL = `${detectedUrl}/api`;
        }
      } catch (error) {
        // Continue with original URL
      }
    }

    console.log('API Request:', config.method?.toUpperCase(), config.url);
    console.log('API Request data:', config.data ? (typeof config.data === 'string' ? config.data.substring(0, 100) : JSON.stringify(config.data).substring(0, 100)) : 'none');
    return config;
  },
  (error) => {
    console.error('API Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging and auto-detection retry
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    console.log('✅ API Base URL:', api.defaults.baseURL);
    return response;
  },
  async (error) => {
    console.error('❌ API Response error:', error.response?.status, error.config?.url);
    console.error('❌ API Error details:', error.response?.data || error.message);
    console.error('❌ API Base URL:', api.defaults.baseURL);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error object:', JSON.stringify({
      code: error.code,
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null,
      request: error.request ? 'Request object exists' : null
    }, null, 2));
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response headers:', error.response.headers);
    }
    
    // If request failed and we haven't tried auto-detection yet, try it
    if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      if (!isAutoDetecting && !autoDetectionPromise && typeof window === 'undefined') {
        console.log('Connection failed, attempting auto-detection...');
        isAutoDetecting = true;
        autoDetectionPromise = autoDetectApiUrl();
        
        try {
          const detectedUrl = await autoDetectionPromise;
          if (detectedUrl) {
            API_BASE_URL = detectedUrl;
            api.defaults.baseURL = `${API_BASE_URL}/api`;
            console.log('✅ Auto-detected and updated API URL:', API_BASE_URL);
            
            // Retry the original request with new URL
            const originalRequest = error.config;
            originalRequest.baseURL = `${API_BASE_URL}/api`;
            return api.request(originalRequest);
          }
        } catch (detectError) {
          console.warn('Auto-detection failed:', detectError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const songApi = {
  /**
   * Get all songs with optional search/filter
   */
  getAll: async (params?: {
    search?: string;
    type?: string;
    key?: string;
    tags?: string[];
  }): Promise<Song[]> => {
    const response = await api.get<Song[]>('/songs', { params });
    return response.data;
  },

  /**
   * Get song by ID
   */
  getById: async (id: string): Promise<Song> => {
    const response = await api.get<Song>(`/songs/${id}`);
    return response.data;
  },

  /**
   * Create new song
   */
  create: async (song: CreateSongDto): Promise<Song> => {
    try {
      console.log('API: Creating song at:', `${api.defaults.baseURL}/songs`);
      console.log('API: Song data:', {
        title: song.title,
        artist: song.artist,
        type: song.type,
        key: song.key,
        tags: song.tags,
        extractedTextLength: song.extractedText?.length || 0,
      });

      // Validate required fields
      if (!song.title || !song.title.trim()) {
        throw new Error('Song title is required');
      }
      if (!song.extractedText || !song.extractedText.trim()) {
        throw new Error('Song text is required');
      }

      // Ensure all required fields have values
      // Ensure artist is an array
      const artistArray = Array.isArray(song.artist) 
        ? song.artist 
        : (song.artist && typeof song.artist === 'string' ? [song.artist] : []);

      const songData: CreateSongDto = {
        title: song.title.trim(),
        artist: artistArray,
        type: song.type || 'chords',
        key: song.key || '', // Allow empty key (no default)
        tags: song.tags || [],
        extractedText: song.extractedText.trim(),
        rawFileUrl: song.rawFileUrl,
      };

      console.log('API: Sending song data to backend...');
      const response = await api.post<Song>('/songs', songData);

      console.log('API: Song created successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('API: Create error:', error);
      if (error.response) {
        console.error('API: Response status:', error.response.status);
        console.error('API: Response data:', JSON.stringify(error.response.data, null, 2));
        // Throw a more descriptive error with full details
        const errorData = error.response.data || {};
        const errorMessage = errorData.error || errorData.message || `Server error: ${error.response.status}`;
        const fullError = errorData.details ? `${errorMessage}\n\nDetails: ${errorData.details}` : errorMessage;
        console.error('API: Full error message:', fullError);
        throw new Error(fullError);
      } else if (error.request) {
        console.error('API: No response received:', error.request);
        throw new Error('Network error. Please check your connection and ensure the backend server is running.');
      } else {
        console.error('API: Error setting up request:', error.message);
        throw error;
      }
    }
  },

  /**
   * Update song
   */
  update: async (id: string, updates: UpdateSongDto): Promise<Song> => {
    const response = await api.put<Song>(`/songs/${id}`, updates);
    return response.data;
  },

  /**
   * Delete song
   */
  delete: async (id: string): Promise<void> => {
    try {
      console.log('API: Deleting song:', id);
      const response = await api.delete(`/songs/${id}`);
      console.log('API: Delete response status:', response.status);
      console.log('API: Delete response headers:', response.headers);
      
      // 204 No Content or 200 OK are valid success responses
      // 204 means success with no content body
      if (response.status === 204 || response.status === 200) {
        console.log('API: Delete successful - song removed from database');
        return;
      } else {
        console.warn('API: Unexpected status code:', response.status);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('API: Delete error:', error);
      if (error.response) {
        console.error('API: Response status:', error.response.status);
        console.error('API: Response data:', error.response.data);
        const errorMessage = error.response.data?.error || `Failed to delete song: ${error.response.status}`;
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error('API: No response received:', error.request);
        throw new Error('Network error. Please check your connection and ensure the backend server is running.');
      } else {
        console.error('API: Error setting up request:', error.message);
        throw error;
      }
    }
  },

  /**
   * Upload file and extract text
   */
  uploadAndExtract: async (fileUri: string, fileType: string): Promise<{ text: string; fileUrl?: string }> => {
    try {
      const formData = new FormData();
      
      console.log('Processing file URI:', fileUri.substring(0, 100));
      console.log('File type:', fileType);
      
      // Handle data URIs (base64 encoded files from file picker)
      if (fileUri.startsWith('data:')) {
        console.log('Detected data URI, converting to blob...');
        // Extract base64 data from data URI
        const base64Data = fileUri.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: fileType });
        const fileName = `file.${fileType.split('/')[1] || 'txt'}`;
        const file = new File([blob], fileName, { type: fileType });
        formData.append('file', file);
        console.log('Converted data URI to File object:', fileName);
      }
      // Handle blob URLs
      else if (typeof window !== 'undefined' && (fileUri.startsWith('blob:') || fileUri.startsWith('http'))) {
        console.log('Detected blob/http URL, fetching...');
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const fileName = fileUri.split('/').pop() || 'file';
        const file = new File([blob], fileName, { type: fileType });
        formData.append('file', file);
        console.log('Fetched and created File object:', fileName);
      }
      // Handle mobile file paths
      else {
        console.log('Using mobile file format');
        const file = {
          uri: fileUri,
          type: fileType,
          name: fileUri.split('/').pop() || 'file',
        } as any;
        formData.append('file', file);
      }
      
      console.log('Uploading file to:', `${api.defaults.baseURL}/songs/upload`);
      const response = await api.post<{ text: string; fileUrl?: string }>('/songs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Upload error details:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },
};

export default api;

