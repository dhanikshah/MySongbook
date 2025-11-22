/**
 * Hook for searching and filtering songs
 */

import { useMemo } from 'react';
import { Song } from '../types/Song';

export interface SearchFilters {
  query?: string;
  type?: string;
  key?: string;
  tags?: string[];
}

export function useSearch(songs: Song[], filters: SearchFilters) {
  const filteredSongs = useMemo(() => {
    let result = [...songs];

    // Text search (title, artist, text)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.extractedText.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filters.type) {
      result = result.filter(song => song.type === filters.type);
    }

    // Filter by key
    if (filters.key) {
      result = result.filter(song => song.key === filters.key);
    }

    // Filter by tags (AND combination)
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(song => 
        filters.tags!.every(tag => song.tags.includes(tag))
      );
    }

    return result;
  }, [songs, filters]);

  return filteredSongs;
}

