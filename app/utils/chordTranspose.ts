/**
 * Chord transposition utility
 * Detects and transposes chords in song text while preserving formatting
 */

// Musical notes with sharps and flats
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Chord regex pattern - matches chords that are:
// 1. At word boundaries (not part of a word) - preceded by start of line or whitespace
// 2. Followed by whitespace, line end, punctuation, or another chord
// This prevents matching capital letters in words like "Verse", "This", "Amazing"
export const CHORD_PATTERN = /\b([A-G][b#]?)(m|maj7|maj|sus4|sus2|dim|aug|add9|7|9|11|13)?(\/[A-G][b#]?)?(?=\s|$|[^\w])/g;

/**
 * Get note index from note string (handles sharps and flats)
 */
function getNoteIndex(note: string): number {
  // Handle sharps
  if (note.includes('#')) {
    const index = NOTES.indexOf(note);
    if (index !== -1) return index;
  }
  
  // Handle flats
  if (note.includes('b')) {
    const flatIndex = FLAT_NOTES.indexOf(note);
    if (flatIndex !== -1) {
      // Convert flat to sharp equivalent
      return flatIndex;
    }
  }
  
  // Handle natural notes
  const naturalIndex = NOTES.indexOf(note);
  if (naturalIndex !== -1) return naturalIndex;
  
  return -1;
}

/**
 * Get note string from index (prefer sharps)
 */
function getNoteFromIndex(index: number): string {
  return NOTES[index % 12];
}

/**
 * Transpose a single chord (chord only, no prefix)
 */
function transposeChord(chord: string, steps: number): string {
  // Simple pattern for just the chord part (no word boundaries)
  const SIMPLE_CHORD_PATTERN = /([A-G][b#]?)(m|maj7|maj|sus4|sus2|dim|aug|add9|7|9|11|13)?(\/[A-G][b#]?)?/;
  const match = chord.match(SIMPLE_CHORD_PATTERN);
  if (!match) return chord;
  
  const rootNote = match[1];
  const suffix = match[2] || '';
  const slashNote = match[3] || '';
  
  if (!rootNote) return chord;
  
  // Transpose root note
  const rootIndex = getNoteIndex(rootNote);
  if (rootIndex === -1) return chord;
  
  const newRootIndex = (rootIndex + steps + 12) % 12;
  const newRoot = getNoteFromIndex(newRootIndex);
  
  // Transpose slash note if present
  let newSlash = '';
  if (slashNote) {
    const slashBase = slashNote.replace('/', '');
    const slashIndex = getNoteIndex(slashBase);
    if (slashIndex !== -1) {
      const newSlashIndex = (slashIndex + steps + 12) % 12;
      const newSlashNote = getNoteFromIndex(newSlashIndex);
      newSlash = `/${newSlashNote}`;
    } else {
      newSlash = slashNote;
    }
  }
  
  return `${newRoot}${suffix}${newSlash}`;
}

/**
 * Transpose all chords in song text
 * Preserves line breaks, spaces, and formatting
 */
export function transposeSongText(text: string, steps: number): string {
  if (steps === 0) return text;
  
  // Split by lines to preserve structure
  const lines = text.split('\n');
  
  return lines.map(line => {
    // Find all chord matches in the line
    const matches: Array<{ index: number; chord: string; fullMatch: string; prefix: string }> = [];
    let match;
    
    // Reset regex
    CHORD_PATTERN.lastIndex = 0;
    
    while ((match = CHORD_PATTERN.exec(line)) !== null) {
      const rootNote = match[1];
      const suffix = match[2] || '';
      const slashNote = match[3] || '';
      const fullChord = rootNote + suffix + slashNote;
      const fullMatch = match[0];
      
      matches.push({
        index: match.index,
        chord: fullChord,
        fullMatch: fullMatch,
        prefix: '', // No prefix needed for this implementation
      });
    }
    
    // If no chords found, return line as-is
    if (matches.length === 0) return line;
    
    // Build new line by replacing chords
    let newLine = line;
    // Process from end to start to preserve indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const { index, chord, fullMatch } = matches[i];
      const transposed = transposeChord(chord, steps);
      // Replace the chord with transposed version
      newLine = newLine.substring(0, index) + transposed + newLine.substring(index + fullMatch.length);
    }
    
    return newLine;
  }).join('\n');
}

/**
 * Get all unique chords found in text
 */
export function extractChords(text: string): string[] {
  const chords = new Set<string>();
  let match;
  
  CHORD_PATTERN.lastIndex = 0;
  
  while ((match = CHORD_PATTERN.exec(text)) !== null) {
    chords.add(match[0]);
  }
  
  return Array.from(chords).sort();
}

