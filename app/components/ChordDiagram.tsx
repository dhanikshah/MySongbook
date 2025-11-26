import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';
// Import chord data directly from JSON files
// Note: Metro bundler should handle JSON imports automatically
const guitarChordsData = require('@tombatossals/chords-db/lib/guitar.json');
import { useTheme } from '../context/ThemeContext';

interface ChordDiagramProps {
  chordName: string;
  onClose: () => void;
  visible: boolean;
}

// Map chord names to chords-db format
function normalizeChordName(chordName: string): { root: string; suffix: string } {
  // Remove whitespace
  const clean = chordName.trim();
  
  // Extract root note (C, C#, Db, D, etc.)
  let root = '';
  let suffix = '';
  
  if (clean.length === 0) return { root: '', suffix: '' };
  
  // Handle sharps and flats in root
  if (clean.length > 1 && (clean[1] === '#' || clean[1] === 'b')) {
    root = clean.substring(0, 2);
    suffix = clean.substring(2);
  } else {
    root = clean[0];
    suffix = clean.substring(1);
  }
  
  // Normalize flats to sharps and convert to chords-db format
  const flatToSharp: { [key: string]: string } = {
    'Db': 'Csharp',
    'Eb': 'Eb', // Keep as Eb (chords-db uses Eb, not D#)
    'Gb': 'Fsharp',
    'Ab': 'Ab', // Keep as Ab (chords-db uses Ab, not G#)
    'Bb': 'Bb', // Keep as Bb (chords-db uses Bb, not A#)
  };
  
  // Convert sharp notation to chords-db format
  if (root.includes('#')) {
    root = root.replace('#', 'sharp');
  }
  
  if (flatToSharp[root]) {
    root = flatToSharp[root];
  }
  
  // Normalize common suffixes to match chords-db format
  if (!suffix || suffix === '') {
    suffix = 'major';
  } else if (suffix === 'm') {
    suffix = 'minor';
  } else if (suffix === 'maj' || suffix === 'M') {
    suffix = 'major';
  } else if (suffix === '7') {
    suffix = '7'; // Keep as '7' (not 'dominant')
  } else if (suffix === 'maj7' || suffix === 'M7') {
    suffix = 'maj7'; // Keep as 'maj7' (not 'major7')
  } else if (suffix === 'm7') {
    suffix = 'm7'; // Keep as 'm7' (not 'minor7')
  } else if (suffix === 'sus4') {
    suffix = 'sus4';
  } else if (suffix === 'sus2') {
    suffix = 'sus2';
  } else if (suffix === 'dim') {
    suffix = 'dim'; // Keep as 'dim' (not 'diminished')
  } else if (suffix === 'aug') {
    suffix = 'aug'; // Keep as 'aug' (not 'augmented')
  }
  
  return { root, suffix };
}

// Get chord data from chords-db
export function getChordData(chordName: string): any[] {
  try {
    const { root, suffix } = normalizeChordName(chordName);
    
    if (!root || !suffix) {
      return [];
    }
    
    // Access chords-db structure: guitarChordsData.chords[root] is an array of chord objects
    const chords = (guitarChordsData as any).chords || {};
    const rootChords = chords[root];
    
    if (!rootChords || !Array.isArray(rootChords) || rootChords.length === 0) {
      return [];
    }
    
    // Filter chords by suffix (case-insensitive)
    const matchingChords = rootChords.filter((chord: any) => 
      chord.suffix?.toLowerCase() === suffix.toLowerCase()
    );
    
    if (matchingChords.length === 0) {
      return [];
    }
    
    // Return array of positions from all matching chords
    const allPositions: any[] = [];
    matchingChords.forEach((chord: any) => {
      if (chord.positions && Array.isArray(chord.positions)) {
        chord.positions.forEach((position: any) => {
          // Ensure all position data is properly copied
          // Make sure fingers is always an array, even if it's empty
          const positionFingers = Array.isArray(position.fingers) 
            ? position.fingers 
            : (position.fingers !== undefined ? [position.fingers] : []);
          
          allPositions.push({
            frets: position.frets,
            fingers: positionFingers,
            barres: position.barres || [],
            baseFret: position.baseFret || 1,
            capo: position.capo || false,
            midi: position.midi,
            key: chord.key,
            suffix: chord.suffix,
          });
        });
      }
    });
    
    return allPositions;
  } catch (error) {
    console.error('Error getting chord data:', error);
    return [];
  }
}

// Render chord diagram using SVG
function ChordDiagramSVG({ chord }: { chord: any }) {
  const { theme } = useTheme();
  
  if (!chord || !chord.frets) {
    return null;
  }
  
  const width = 200;
  const height = 250;
  const stringCount = 6;
  const fretCount = 4;
  const stringSpacing = 30;
  const fretSpacing = 50;
  const startX = 40;
  const startY = 40;
  const nutY = startY;
  const stringWidth = 2;
  const fretWidth = 3;
  const circleRadius = 8;
  
  let frets: any = chord.frets;
  // Ensure fingers is always an array - check multiple possible formats
  // fingers array can contain 0 (no finger assigned), 1-4 (finger number), or undefined/null (muted string)
  let fingers: (number | undefined)[] = [];
  if (Array.isArray(chord.fingers)) {
    fingers = chord.fingers;
  } else if (chord.fingers !== undefined && chord.fingers !== null) {
    // If it's not an array, try to handle it
    console.warn('Fingers is not an array:', chord.fingers, 'for chord:', chord);
  }
  const barres = Array.isArray(chord.barres) ? chord.barres : [];
  const baseFret = chord.baseFret || 1;
  
  // Convert frets to array format
  let fretsArray: (number | null)[] = [];
  if (typeof frets === 'string') {
    // String format like "x32010" or "032010"
    fretsArray = frets.split('').map(f => {
      if (f === 'x' || f === 'X' || f === '-') return null;
      const num = parseInt(f, 10);
      return isNaN(num) ? null : num;
    });
  } else if (Array.isArray(frets)) {
    // Array format like [null, 3, 2, 0, 1, 0] or [-1, 3, 2, 0, 1, 0]
    fretsArray = frets.map((f: any) => {
      if (f === 'x' || f === 'X' || f === '-' || f === null || f < 0) return null;
      return f;
    });
  }
  
  // Pad to 6 strings if needed
  while (fretsArray.length < stringCount) {
    fretsArray.push(null);
  }
  fretsArray = fretsArray.slice(0, stringCount);
  
  // Ensure fingers array matches frets array length
  // Pad with undefined if needed, or truncate if too long
  while (fingers.length < stringCount) {
    fingers.push(undefined);
  }
  fingers = fingers.slice(0, stringCount);
  
  // Calculate actual fret positions
  const validFrets = fretsArray.filter((f): f is number => f !== null && f >= 0);
  const hasOpenStrings = fretsArray.some(f => f === 0);
  const minFret = validFrets.length > 0 ? Math.min(...validFrets.filter(f => f > 0)) : 1;
  
  // Use baseFret from chord data if available, otherwise calculate
  const chordBaseFret = chord.baseFret || 1;
  const showBaseFret = chordBaseFret > 1 || (minFret > 1 && !hasOpenStrings);
  const actualBaseFret = chordBaseFret > 1 ? chordBaseFret : (minFret > 1 ? minFret : 1);
  
  // When baseFret > 1, the frets in the database are already relative to baseFret
  // So we use them as-is for display (they're already 1, 2, 3, 4 relative positions)
  // The baseFret indicator tells us where the diagram actually starts on the neck
  const adjustedFrets = fretsArray;
  
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Fret lines */}
      {Array.from({ length: fretCount + 1 }).map((_, i) => (
        <Line
          key={`fret-${i}`}
          x1={startX}
          y1={nutY + i * fretSpacing}
          x2={startX + (stringCount - 1) * stringSpacing}
          y2={nutY + i * fretSpacing}
          stroke={theme.text}
          strokeWidth={i === 0 ? fretWidth * 2 : fretWidth}
        />
      ))}
      
      {/* String lines */}
      {Array.from({ length: stringCount }).map((_, i) => (
        <Line
          key={`string-${i}`}
          x1={startX + i * stringSpacing}
          y1={nutY}
          x2={startX + i * stringSpacing}
          y2={nutY + fretCount * fretSpacing}
          stroke={theme.text}
          strokeWidth={stringWidth}
        />
      ))}
      
      {/* Barres */}
      {barres.map((barreFret: number, idx: number) => {
        // barreFret is the relative fret position (1-4) where the barre is
        // Find strings that have this relative fret position
        const stringsWithBarre: number[] = [];
        adjustedFrets.forEach((fret, stringIdx) => {
          if (fret === barreFret && fret !== null && fret > 0) {
            stringsWithBarre.push(stringIdx);
          }
        });
        
        if (stringsWithBarre.length < 2) return null;
        
        const startString = Math.min(...stringsWithBarre);
        const endString = Math.max(...stringsWithBarre);
        // barreFret is already a relative position (1-4), use it directly
        const yPos = nutY + barreFret * fretSpacing;
        
        return (
          <Line
            key={`barre-${idx}`}
            x1={startX + startString * stringSpacing}
            y1={yPos}
            x2={startX + endString * stringSpacing}
            y2={yPos}
            stroke={theme.text}
            strokeWidth={12}
            strokeLinecap="round"
          />
        );
      })}
      
      {/* Fingered notes */}
      {adjustedFrets.map((adjustedFret, stringIndex) => {
        // Get the original fret value to check if string is open/muted
        const originalFret = fretsArray[stringIndex];
        
        // Check if string is open or muted using original fret value
        if (originalFret === null || originalFret < 0) {
          // Muted string (X at top)
          return (
            <G key={`mute-${stringIndex}`}>
              <Line
                x1={startX + stringIndex * stringSpacing - 8}
                y1={nutY - 20}
                x2={startX + stringIndex * stringSpacing + 8}
                y2={nutY - 10}
                stroke={theme.text}
                strokeWidth={2}
              />
              <Line
                x1={startX + stringIndex * stringSpacing - 8}
                y1={nutY - 10}
                x2={startX + stringIndex * stringSpacing + 8}
                y2={nutY - 20}
                stroke={theme.text}
                strokeWidth={2}
              />
            </G>
          );
        }
        
        if (originalFret === 0) {
          // Open string indicator (small circle at top)
          return (
            <Circle
              key={`open-${stringIndex}`}
              cx={startX + stringIndex * stringSpacing}
              cy={nutY - 15}
              r={5}
              fill="none"
              stroke={theme.text}
              strokeWidth={2}
            />
          );
        }
        
        // This is a fretted note - get finger position
        // Ensure we have a valid adjusted fret value
        if (adjustedFret === null || adjustedFret < 0) {
          return null;
        }
        
        // Get finger position - check if it exists in the fingers array
        // Make sure we're accessing the correct index
        // Note: fingers array may have 0 values (no finger assigned) or undefined/null for muted strings
        // The fingers array should be aligned with the frets array (same length, same indices)
        const finger = (stringIndex < fingers.length && 
                       fingers[stringIndex] !== undefined && 
                       fingers[stringIndex] !== null) 
          ? fingers[stringIndex] 
          : undefined;
        const yPos = nutY + adjustedFret * fretSpacing;
        
        // Show finger number if it's > 0 (0 means no finger assigned, but note is still fretted)
        // The circle should always be shown for fretted notes, even if finger is 0
        const showFingerNumber = finger !== undefined && finger !== null && finger > 0;
        
        return (
          <G key={`finger-${stringIndex}`}>
            <Circle
              cx={startX + stringIndex * stringSpacing}
              cy={yPos}
              r={circleRadius}
              fill={theme.primary}
              stroke={theme.text}
              strokeWidth={2}
            />
            {showFingerNumber && (
              <SvgText
                x={startX + stringIndex * stringSpacing}
                y={yPos + 5}
                fontSize="12"
                fill={theme.primaryText || theme.text}
                textAnchor="middle"
                fontWeight="bold"
              >
                {finger}
              </SvgText>
            )}
          </G>
        );
      })}
      
      {/* Base fret indicator */}
      {showBaseFret && actualBaseFret > 1 && (
        <SvgText
          x={startX - 25}
          y={nutY + fretSpacing * 0.5 + 5}
          fontSize="14"
          fill={theme.text}
          fontWeight="bold"
        >
          {actualBaseFret}fr
        </SvgText>
      )}
    </Svg>
  );
}

export function ChordDiagram({ chordName, onClose, visible }: ChordDiagramProps) {
  const { theme } = useTheme();
  const [selectedVoicing, setSelectedVoicing] = useState(0);
  
  const chordData = getChordData(chordName);
  const hasMultipleVoicings = chordData.length > 1;
  
  if (!visible || chordData.length === 0) {
    return null;
  }
  
  const currentChord = chordData[selectedVoicing];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {chordName}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {hasMultipleVoicings && (
            <View style={styles.voicingSelector}>
              <Text style={[styles.voicingLabel, { color: theme.textSecondary }]}>
                Voicing {selectedVoicing + 1} of {chordData.length}
              </Text>
              <View style={styles.voicingButtons}>
                <TouchableOpacity
                  onPress={() => setSelectedVoicing(Math.max(0, selectedVoicing - 1))}
                  disabled={selectedVoicing === 0}
                  style={[
                    styles.voicingButton,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                    selectedVoicing === 0 && styles.voicingButtonDisabled
                  ]}
                >
                  <Text style={[styles.voicingButtonText, { color: theme.primaryText }]}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedVoicing(Math.min(chordData.length - 1, selectedVoicing + 1))}
                  disabled={selectedVoicing === chordData.length - 1}
                  style={[
                    styles.voicingButton,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                    selectedVoicing === chordData.length - 1 && styles.voicingButtonDisabled
                  ]}
                >
                  <Text style={[styles.voicingButtonText, { color: theme.primaryText }]}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <View style={styles.chordContainer}>
            {currentChord ? (
              <ChordDiagramSVG chord={currentChord} />
            ) : (
              <Text style={[styles.noDataText, { color: theme.textSecondary }]}>
                Chord diagram not available for "{chordName}"
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 16,
  },
  modalContent: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Platform.OS === 'web' ? 24 : 20,
    maxWidth: Platform.OS === 'web' ? 500 : '90%',
    maxHeight: Platform.OS === 'web' ? '80%' : '80%',
    width: Platform.OS === 'web' ? 'auto' : '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  voicingSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  voicingLabel: {
    fontSize: 14,
  },
  voicingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voicingButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  voicingButtonDisabled: {
    opacity: 0.5,
  },
  voicingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingVertical: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 20,
  },
});
