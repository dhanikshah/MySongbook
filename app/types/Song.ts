export type SongType = "lyrics" | "chords" | "tabs";

export interface Song {
  id: string;
  title: string;
  artist: string[]; // Changed to array to support multiple artists
  type: SongType;
  key: string; // musical key, e.g. "C", "G#m"
  tags: string[];
  rawFileUrl?: string;
  extractedText: string; // OCR extracted text or manual text
  createdAt: number;
  updatedAt: number;
}

export interface CreateSongDto {
  title: string;
  artist: string[]; // Changed to array to support multiple artists
  type: SongType;
  key: string;
  tags: string[];
  extractedText: string;
  rawFileUrl?: string;
}

export interface UpdateSongDto {
  title?: string;
  artist?: string[]; // Changed to array to support multiple artists
  type?: SongType;
  key?: string;
  tags?: string[];
  extractedText?: string;
}

