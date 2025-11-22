import express, { Request, Response } from 'express';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { getDb } from '../db/database';
import { ocrService } from '../services/ocrService';
import { storageService } from '../services/storageService';
import { Song, CreateSongDto, UpdateSongDto } from '../types/Song';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all songs with optional filters
router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { search, type, key, tags } = req.query;

    let query = 'SELECT * FROM songs WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (title LIKE ? OR artist LIKE ? OR extractedText LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (key) {
      query += ' AND key = ?';
      params.push(key);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      // SQLite JSON search - simple approach
      tagArray.forEach(tag => {
        query += ' AND tags LIKE ?';
        params.push(`%"${tag}"%`);
      });
    }

    query += ' ORDER BY updatedAt DESC';

    const songs = db.prepare(query).all(...params) as Song[];
    
    // Parse JSON tags and artists
    const parsedSongs = songs.map(song => {
      const parsedTags = JSON.parse(song.tags as any);
      let parsedArtists: string[] = [];
      
      // Handle artist - could be string (old format) or JSON array (new format)
      if (typeof song.artist === 'string') {
        try {
          // Try to parse as JSON first (for arrays stored as JSON strings)
          parsedArtists = JSON.parse(song.artist);
          if (!Array.isArray(parsedArtists)) {
            // If not an array, treat as single artist string
            const artistStr = typeof song.artist === 'string' ? song.artist : String(song.artist);
            parsedArtists = artistStr.trim() ? [artistStr] : [];
          }
        } catch {
          // If parsing fails, treat as single artist string
          const artistStr = typeof song.artist === 'string' ? song.artist : String(song.artist);
          parsedArtists = artistStr.trim() ? [artistStr] : [];
        }
      } else if (Array.isArray(song.artist)) {
        parsedArtists = song.artist;
      }
      
      return {
        ...song,
        tags: parsedTags,
        artist: parsedArtists,
      };
    });

    res.json(parsedSongs);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// Get song by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id) as Song | undefined;

    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

        // Parse JSON tags and artists
        let parsedArtists: string[] = [];
        if (typeof song.artist === 'string') {
          try {
            parsedArtists = JSON.parse(song.artist);
            if (!Array.isArray(parsedArtists)) {
              const artistStr = typeof song.artist === 'string' ? song.artist : String(song.artist);
              parsedArtists = artistStr.trim() ? [artistStr] : [];
            }
          } catch {
            const artistStr = typeof song.artist === 'string' ? song.artist : String(song.artist);
            parsedArtists = artistStr.trim() ? [artistStr] : [];
          }
        } else if (Array.isArray(song.artist)) {
          parsedArtists = song.artist;
        }

        res.json({
          ...song,
          tags: JSON.parse(song.tags as any),
          artist: parsedArtists,
        });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// Create new song
router.post('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const songData: CreateSongDto = req.body;

    // Validate required fields
    if (!songData.title || !songData.title.trim()) {
      return res.status(400).json({ error: 'Song title is required' });
    }
    if (!songData.extractedText || !songData.extractedText.trim()) {
      return res.status(400).json({ error: 'Song text is required' });
    }

    // Ensure all required fields have default values
    const now = Date.now();
    
    // Ensure artist is an array
    const artistArray = Array.isArray(songData.artist) 
      ? songData.artist 
      : (songData.artist && typeof songData.artist === 'string' ? [songData.artist] : []);

    // Ensure tags is an array
    const tagsArray = Array.isArray(songData.tags) ? songData.tags : [];

    const song: Song = {
      id: randomUUID(),
      title: songData.title.trim(),
      artist: artistArray,
      type: songData.type || 'chords',
      key: songData.key || '', // Allow empty key (no default)
      tags: tagsArray,
      rawFileUrl: songData.rawFileUrl,
      extractedText: songData.extractedText.trim(),
      createdAt: now,
      updatedAt: now,
    };

    console.log('Backend: Creating song:', {
      id: song.id,
      title: song.title,
      artist: song.artist,
      type: song.type,
      key: song.key,
      tagsCount: song.tags.length,
      textLength: song.extractedText.length,
    });

    // Ensure we have valid JSON strings (even for empty arrays)
    const artistJson = JSON.stringify(song.artist || []);
    const tagsJson = JSON.stringify(song.tags || []);
    
    // Validate that we have valid strings
    if (typeof artistJson !== 'string' || typeof tagsJson !== 'string') {
      throw new Error('Failed to stringify artist or tags');
    }
    
    console.log('Backend: Inserting song with data:', {
      id: song.id,
      title: song.title,
      artistArray: song.artist,
      artistJson: artistJson,
      type: song.type,
      key: song.key || '(empty)',
      tagsArray: song.tags,
      tagsJson: tagsJson,
      extractedTextLength: song.extractedText.length,
    });

    try {
      const stmt = db.prepare(`
        INSERT INTO songs (id, title, artist, type, key, tags, rawFileUrl, extractedText, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      console.log('Backend: About to execute insert with values:', {
        id: song.id,
        title: song.title.substring(0, 50),
        artistJson: artistJson.substring(0, 100),
        type: song.type,
        key: song.key || '(empty)',
        tagsJson: tagsJson.substring(0, 100),
        rawFileUrl: song.rawFileUrl || null,
        extractedTextLength: song.extractedText.length,
        createdAt: song.createdAt,
        updatedAt: song.updatedAt,
      });
      
      const result = stmt.run(
        song.id,
        song.title,
        artistJson, // Store artists as JSON array
        song.type,
        song.key || '', // Ensure empty string if undefined
        tagsJson,
        song.rawFileUrl || null,
        song.extractedText,
        song.createdAt,
        song.updatedAt
      );
      
      console.log('Backend: Insert result:', {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      });

      console.log('Backend: Song created successfully:', song.id);
      // Return the song with artist as array (as expected by frontend)
      res.status(201).json({
        ...song,
        artist: song.artist, // Already an array
      });
    } catch (dbError) {
      console.error('Backend: Database insert error:', dbError);
      console.error('Backend: Database error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown',
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        code: (dbError as any)?.code,
        errno: (dbError as any)?.errno,
      });
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error creating song:', error);
    console.error('Error type:', typeof error);
    console.error('Error name:', error instanceof Error ? error.name : 'N/A');
    console.error('Error message:', error instanceof Error ? error.message : 'N/A');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Log the full error object
    if (error && typeof error === 'object') {
      console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Send detailed error response
    const errorResponse: any = { 
      error: 'Failed to create song: ' + errorMessage,
      errorType: error instanceof Error ? error.name : typeof error
    };
    
    // Only include stack trace in development
    if (process.env.NODE_ENV !== 'production' && errorStack) {
      errorResponse.details = errorStack;
    }
    
    console.error('Backend: Sending error response:', errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Update song
router.put('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const updates: UpdateSongDto = req.body;
    const songId = req.params.id;

    console.log('Backend: Updating song:', songId);
    console.log('Backend: Update data:', {
      title: updates.title,
      artist: updates.artist,
      key: updates.key,
      tags: updates.tags,
    });

    const existing = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId) as Song | undefined;
    if (!existing) {
      console.log('Backend: Song not found:', songId);
      return res.status(404).json({ error: 'Song not found' });
    }

    // Ensure artist is an array
    let artistArray: string[] = existing.artist;
    if (updates.artist !== undefined) {
      artistArray = Array.isArray(updates.artist) 
        ? updates.artist 
        : (updates.artist && typeof updates.artist === 'string' ? [updates.artist] : []);
    }

    // Merge updates with existing data
    const updated: Song = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: Date.now(),
      tags: updates.tags !== undefined ? updates.tags : JSON.parse(existing.tags as any),
      // Ensure all fields are set
      title: updates.title !== undefined ? updates.title : existing.title,
      artist: artistArray,
      key: updates.key !== undefined ? (updates.key.trim() || '') : existing.key, // Allow empty key - if key is provided (even empty string), use it
      type: updates.type !== undefined ? updates.type : existing.type,
      extractedText: updates.extractedText !== undefined ? updates.extractedText : existing.extractedText,
    };

    console.log('Backend: Final updated song data:', {
      title: updated.title,
      artist: updated.artist,
      key: updated.key,
      tags: updated.tags,
    });
    console.log('Backend: Artist value:', updated.artist, 'Type:', typeof updated.artist);

    db.prepare(`
      UPDATE songs
      SET title = ?, artist = ?, type = ?, key = ?, tags = ?, extractedText = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      updated.title,
      JSON.stringify(updated.artist), // Store artists as JSON array
      updated.type,
      updated.key,
      JSON.stringify(updated.tags),
      updated.extractedText,
      updated.updatedAt,
      updated.id
    );

    console.log('Backend: Song updated successfully:', songId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: 'Failed to update song: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
});

// Delete song
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const songId = req.params.id;
    
    console.log('Backend: Attempting to delete song:', songId);
    
    // First check if song exists
    const existing = db.prepare('SELECT id, title FROM songs WHERE id = ?').get(songId) as { id: string; title: string } | undefined;
    
    if (!existing) {
      console.log('Backend: Song not found:', songId);
      return res.status(404).json({ error: 'Song not found' });
    }
    
    console.log('Backend: Found song to delete:', existing.title);
    
    // Delete the song
    const result = db.prepare('DELETE FROM songs WHERE id = ?').run(songId);
    
    console.log('Backend: Delete result - changes:', result.changes);

    if (result.changes === 0) {
      console.warn('Backend: No rows deleted, but song exists. This should not happen.');
      return res.status(500).json({ error: 'Failed to delete song' });
    }

    console.log('Backend: Song deleted successfully:', songId);
    res.status(200).json({ success: true, message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Failed to delete song: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
});

// Upload file and extract text
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Extract text using OCR service
    const extractedText = await ocrService.extractText(filePath, mimeType);

    // Optionally save file to storage
    const fileUrl = await storageService.saveFile(req.file);

    res.json({
      text: extractedText,
      fileUrl: fileUrl || undefined,
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

export { router as songsRouter };

