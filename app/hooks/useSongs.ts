/**
 * Hook for managing songs
 */

import { useState, useEffect, useCallback } from 'react';
import { Song, CreateSongDto, UpdateSongDto } from '../types/Song';
import { songApi } from '../services/api';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSongs = useCallback(async (params?: {
    search?: string;
    type?: string;
    key?: string;
    tags?: string[];
  }, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const data = await songApi.getAll(params);
      // Normalize artist field to always be an array for backward compatibility
      const normalizedData = data.map(song => ({
        ...song,
        artist: Array.isArray(song.artist) 
          ? song.artist 
          : (song.artist && typeof song.artist === 'string' ? [song.artist] : []),
      }));
      setSongs(normalizedData);
      console.log('useSongs: Fetched', normalizedData.length, 'songs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch songs');
      console.error('useSongs: Error fetching songs:', err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const createSong = useCallback(async (song: CreateSongDto): Promise<Song> => {
    try {
      setError(null);
      const newSong = await songApi.create(song);
      // Normalize artist field to always be an array
      const normalizedSong = {
        ...newSong,
        artist: Array.isArray(newSong.artist) 
          ? newSong.artist 
          : (newSong.artist && typeof newSong.artist === 'string' ? [newSong.artist] : []),
      };
      setSongs(prev => [normalizedSong, ...prev]);
      return normalizedSong;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create song';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateSong = useCallback(async (id: string, updates: UpdateSongDto): Promise<Song> => {
    try {
      setError(null);
      const updated = await songApi.update(id, updates);
      // Normalize artist field to always be an array
      const normalizedSong = {
        ...updated,
        artist: Array.isArray(updated.artist) 
          ? updated.artist 
          : (updated.artist && typeof updated.artist === 'string' ? [updated.artist] : []),
      };
      setSongs(prev => prev.map(s => s.id === id ? normalizedSong : s));
      return normalizedSong;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update song';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteSong = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      console.log('useSongs: Deleting song with id:', id);
      
      // Call API to delete from database
      await songApi.delete(id);
      console.log('useSongs: API delete successful - song deleted from database');
      
      // Update local state immediately
      console.log('useSongs: Updating local state, removing song:', id);
      setSongs(prev => {
        const beforeCount = prev.length;
        const filtered = prev.filter(s => s.id !== id);
        const afterCount = filtered.length;
        console.log('useSongs: Songs before:', beforeCount, 'after:', afterCount);
        if (beforeCount === afterCount) {
          console.warn('useSongs: WARNING - Song count did not change! Song might not have been in list.');
        } else {
          console.log('useSongs: Song successfully removed from local state');
        }
        return filtered;
      });
      console.log('useSongs: Local state updated successfully');
    } catch (err) {
      console.error('useSongs: Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete song';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return {
    songs,
    loading,
    error,
    fetchSongs,
    createSong,
    updateSong,
    deleteSong,
    refetch: fetchSongs,
  };
}

