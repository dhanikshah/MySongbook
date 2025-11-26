import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../app/context/ThemeContext';
import { ChordDiagram } from '../../app/components/ChordDiagram';
import { AllChordVoicings } from '../../app/components/AllChordVoicings';

// Import chord data - use require for React Native compatibility
// @ts-ignore - JSON import
const guitarChordsData = require('@tombatossals/chords-db/lib/guitar.json');

interface ChordInfo {
  key: string;
  suffix: string;
  positions: any[];
}

export function ChordLibraryPage() {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = Platform.OS !== 'web' && width < 768;

  const [selectedRoot, setSelectedRoot] = useState<string | null>(null);
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  const [selectedChordRoot, setSelectedChordRoot] = useState<string | null>(null);
  const [selectedChordSuffix, setSelectedChordSuffix] = useState<string | null>(null);
  const [showChordDiagram, setShowChordDiagram] = useState(false);
  const [showAllVoicings, setShowAllVoicings] = useState(false);

  // Extract all chords from the database
  const allChords = useMemo(() => {
    const chords: { [root: string]: ChordInfo[] } = {};
    const chordsData = (guitarChordsData as any).chords || {};

    Object.keys(chordsData).forEach((root) => {
      const rootChords = chordsData[root];
      if (Array.isArray(rootChords)) {
        rootChords.forEach((chord: ChordInfo) => {
          if (!chords[root]) {
            chords[root] = [];
          }
          chords[root].push(chord);
        });
      }
    });

    // Sort roots
    const sortedRoots = Object.keys(chords).sort((a, b) => {
      // Custom sort: C, C#, D, D#/Eb, E, F, F#, G, G#/Ab, A, A#/Bb, B
      const order: { [key: string]: number } = {
        'C': 0, 'Csharp': 1, 'Db': 1,
        'D': 2, 'Dsharp': 3, 'Eb': 3,
        'E': 4,
        'F': 5, 'Fsharp': 6, 'Gb': 6,
        'G': 7, 'Gsharp': 8, 'Ab': 8,
        'A': 9, 'Asharp': 10, 'Bb': 10,
        'B': 11
      };
      return (order[a] ?? 99) - (order[b] ?? 99);
    });

    return { chords, sortedRoots };
  }, []);

  // Get display name for root with proper casing
  const getRootDisplayName = (root: string): string => {
    const displayNames: { [key: string]: string } = {
      'C': 'C',
      'Csharp': 'C#',
      'Db': 'Db',
      'D': 'D',
      'Dsharp': 'D#',
      'Eb': 'Eb',
      'E': 'E',
      'F': 'F',
      'Fsharp': 'F#',
      'Gb': 'Gb',
      'G': 'G',
      'Gsharp': 'G#',
      'Ab': 'Ab',
      'A': 'A',
      'Asharp': 'A#',
      'Bb': 'Bb',
      'B': 'B',
    };
    // Return mapped name or uppercase the first character
    const mapped = displayNames[root];
    if (mapped) return mapped;
    // Default: uppercase first char, keep rest as-is
    return root.charAt(0).toUpperCase() + root.slice(1);
  };

  // Get display name for suffix with proper casing and formatting
  const getSuffixDisplayName = (suffix: string): string => {
    // Comprehensive mapping of all suffixes to their display format
    const displayNames: { [key: string]: string } = {
      // Major chords (no suffix)
      'major': '',
      
      // Minor chords
      'minor': 'm',
      
      // Diminished
      'dim': 'dim',
      'dim7': 'dim7',
      'diminished': 'dim',
      'diminished7': 'dim7',
      
      // Suspended
      'sus2': 'sus2',
      'sus4': 'sus4',
      '7sus4': '7sus4',
      
      // Dominant 7th
      '7': '7',
      '7b5': '7b5',
      '7b9': '7b9',
      '7#9': '7#9',
      '7sg': '7sg',
      
      // Major 7th
      'maj7': 'maj7',
      'major7': 'maj7',
      'maj7#5': 'maj7#5',
      'maj7b5': 'maj7b5',
      
      // Minor 7th
      'm7': 'm7',
      'minor7': 'm7',
      'm7b5': 'm7b5',
      
      // Minor-major 7th
      'mmaj7': 'mmaj7',
      'mmaj7b5': 'mmaj7b5',
      
      // 9th chords
      '9': '9',
      'maj9': 'maj9',
      'major9': 'maj9',
      'm9': 'm9',
      'minor9': 'm9',
      'mmaj9': 'mmaj9',
      '9#11': '9#11',
      '9b5': '9b5',
      'aug9': 'aug9',
      
      // 11th chords
      '11': '11',
      'maj11': 'maj11',
      'm11': 'm11',
      'mmaj11': 'mmaj11',
      
      // 13th chords
      '13': '13',
      'maj13': 'maj13',
      
      // 6th chords
      '6': '6',
      'm6': 'm6',
      'minor6': 'm6',
      '69': '69',
      'm69': 'm69',
      
      // Add chords
      'add9': 'add9',
      'madd9': 'madd9',
      
      // Augmented
      'aug': 'aug',
      'augmented': 'aug',
      'aug7': 'aug7',
      
      // Other
      'alt': 'alt',
      '5': '5',
      
      // Slash chords (bass notes) - keep as-is
      '/A': '/A',
      '/B': '/B',
      '/Bb': '/Bb',
      '/C': '/C',
      '/C#': '/C#',
      '/D': '/D',
      '/D#': '/D#',
      '/E': '/E',
      '/F': '/F',
      '/F#': '/F#',
      '/G': '/G',
      '/G#': '/G#',
      'm/A': 'm/A',
      'm/B': 'm/B',
      'm/C': 'm/C',
      'm/C#': 'm/C#',
      'm/D': 'm/D',
      'm/D#': 'm/D#',
      'm/E': 'm/E',
      'm/F': 'm/F',
      'm/F#': 'm/F#',
      'm/G': 'm/G',
      'm/G#': 'm/G#',
    };
    
    // Check exact match first
    if (displayNames[suffix]) {
      return displayNames[suffix];
    }
    
    // Handle numeric-only suffixes
    if (/^\d+$/.test(suffix)) {
      return suffix;
    }
    
    // For unknown suffixes, return as-is (lowercase for consistency)
    return suffix.toLowerCase();
  };

  // Get chord display name with proper casing
  const getChordDisplayName = (root: string, suffix: string): string => {
    const rootName = getRootDisplayName(root);
    // Ensure root is uppercase (C, D, E, F, G, A, B, C#, etc.)
    const rootUpper = rootName.charAt(0).toUpperCase() + rootName.slice(1);
    const suffixName = getSuffixDisplayName(suffix);
    
    // For major chords (empty suffix), just return root
    if (!suffixName) {
      return rootUpper;
    }
    
    // Combine root and suffix
    // Minor chords should have lowercase 'm', others follow the suffix format
    return rootUpper + suffixName;
  };

  // Filter chords by selected root
  const filteredChords = selectedRoot 
    ? allChords.chords[selectedRoot] || []
    : [];


  // Get all voicings for a chord
  const getAllVoicings = (root: string, suffix: string): any[] => {
    try {
      const chordsData = (guitarChordsData as any).chords || {};
      const rootChords = chordsData[root];
      
      if (!rootChords || !Array.isArray(rootChords) || rootChords.length === 0) {
        return [];
      }
      
      const matchingChords = rootChords.filter((chord: any) => 
        chord.suffix?.toLowerCase() === suffix.toLowerCase()
      );
      
      if (matchingChords.length === 0) {
        return [];
      }
      
      const allPositions: any[] = [];
      matchingChords.forEach((chord: any) => {
        if (chord.positions && Array.isArray(chord.positions)) {
          chord.positions.forEach((position: any) => {
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
      console.error('Error getting chord voicings:', error);
      return [];
    }
  };

  const handleChordClick = (root: string, suffix: string) => {
    const chordName = getChordDisplayName(root, suffix);
    setSelectedChord(chordName);
    setSelectedChordRoot(root);
    setSelectedChordSuffix(suffix);
    setShowAllVoicings(true);
    setShowChordDiagram(false);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top)
    }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Chord Library</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {selectedRoot 
            ? `${getRootDisplayName(selectedRoot)} chords (${filteredChords.length} variations)`
            : `Select a root note to view chords (${allChords.sortedRoots.length} roots available)`
          }
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && { paddingBottom: 80 } // Extra padding for bottom nav on mobile
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Root Note Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Root Notes</Text>
          <View style={styles.rootGrid}>
            {allChords.sortedRoots.map((root) => {
              const isSelected = selectedRoot === root;
              return (
                <TouchableOpacity
                  key={root}
                  onPress={() => setSelectedRoot(isSelected ? null : root)}
                  style={[
                    styles.rootButton,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }
                  ]}
                >
                  <Text style={[
                    styles.rootButtonText,
                    { color: isSelected ? theme.primaryText : theme.text }
                  ]}>
                    {getRootDisplayName(root)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Chord List */}
        {selectedRoot && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {getRootDisplayName(selectedRoot)} Chords
            </Text>
            
            {/* Display all chord variations in a grid, same format as root notes */}
            <View style={styles.rootGrid}>
              {filteredChords.map((chord, idx) => {
                const chordName = getChordDisplayName(chord.key, chord.suffix);
                return (
                  <TouchableOpacity
                    key={`${chord.key}-${chord.suffix}-${idx}`}
                    onPress={() => handleChordClick(chord.key, chord.suffix)}
                    style={[
                      styles.rootButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }
                    ]}
                  >
                    <Text style={[styles.rootButtonText, { color: theme.text }]}>
                      {chordName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* All Voicings View */}
      {showAllVoicings && selectedChordRoot && selectedChordSuffix && (
        <View style={[styles.allVoicingsContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.allVoicingsHeader, { 
            borderBottomColor: theme.border,
            paddingTop: Platform.OS === 'android' ? Math.max(insets.top, 8) : (Platform.OS === 'web' ? 24 : insets.top),
            paddingHorizontal: isMobile ? 12 : 16,
          }]}>
            <Text style={[styles.allVoicingsTitle, { 
              color: theme.text,
              fontSize: isMobile ? 18 : 20,
              flex: 1,
              marginRight: 8,
            }]}>
              {selectedChord} ({getAllVoicings(selectedChordRoot, selectedChordSuffix).length})
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAllVoicings(false);
                setSelectedChord(null);
                setSelectedChordRoot(null);
                setSelectedChordSuffix(null);
              }}
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <AllChordVoicings
            chordName={selectedChord || ''}
            allVoicings={getAllVoicings(selectedChordRoot, selectedChordSuffix)}
          />
        </View>
      )}

      {/* Chord Diagram Modal (for single voicing view) */}
      <ChordDiagram
        chordName={selectedChord || ''}
        visible={showChordDiagram && !showAllVoicings}
        onClose={() => {
          setShowChordDiagram(false);
          setSelectedChord(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  rootGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rootButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  rootButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  allVoicingsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    ...(Platform.OS !== 'web' && {
      paddingBottom: 60, // Space for bottom navigation on mobile
    }),
  },
  allVoicingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  allVoicingsTitle: {
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
});

