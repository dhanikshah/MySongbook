/**
 * Chord parsing utilities
 */

import { CHORD_PATTERN } from './chordTranspose';

export function isValidChord(chord: string): boolean {
  return /^[A-G][b#]?(m|maj7|maj|sus4|sus2|dim|aug|add9|7|9|11|13)?(\/[A-G][b#]?)?$/.test(chord);
}

export function parseChord(chord: string): { root: string; suffix: string; slash: string } | null {
  const match = chord.match(/([A-G][b#]?)(m|maj7|maj|sus4|sus2|dim|aug|add9|7|9|11|13)?(\/[A-G][b#]?)?/);
  if (!match) return null;
  
  return {
    root: match[1],
    suffix: match[2] || '',
    slash: match[3] ? match[3].replace('/', '') : '',
  };
}

