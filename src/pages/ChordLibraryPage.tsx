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

  // Get display name for root
  const getRootDisplayName = (root: string): string => {
    const displayNames: { [key: string]: string } = {
      'Csharp': 'C#',
      'Dsharp': 'D#',
      'Fsharp': 'F#',
      'Gsharp': 'G#',
      'Asharp': 'A#',
    };
    return displayNames[root] || root;
  };

  // Get display name for suffix
  const getSuffixDisplayName = (suffix: string): string => {
    const displayNames: { [key: string]: string } = {
      'major': '',
      'minor': 'm',
      'dim': 'dim',
      'dim7': 'dim7',
      'sus2': 'sus2',
      'sus4': 'sus4',
      '7sus4': '7sus4',
      '7': '7',
      'maj7': 'maj7',
      'm7': 'm7',
      'maj9': 'maj9',
      'm9': 'm9',
      'add9': 'add9',
      'aug': 'aug',
      '6': '6',
      'm6': 'm6',
    };
    return displayNames[suffix] || suffix;
  };

  // Get chord display name
  const getChordDisplayName = (root: string, suffix: string): string => {
    const rootName = getRootDisplayName(root);
    const suffixName = getSuffixDisplayName(suffix);
    return suffixName ? `${rootName}${suffixName}` : rootName;
  };

  // Filter chords by selected root
  const filteredChords = selectedRoot 
    ? allChords.chords[selectedRoot] || []
    : [];

  // Group chords by suffix for better organization
  const groupedChords = useMemo(() => {
    const groups: { [suffix: string]: ChordInfo[] } = {};
    filteredChords.forEach((chord) => {
      if (!groups[chord.suffix]) {
        groups[chord.suffix] = [];
      }
      groups[chord.suffix].push(chord);
    });
    return groups;
  }, [filteredChords]);

  // Common chord suffixes in order of popularity
  const commonSuffixes = [
    'major', 'minor', '7', 'maj7', 'm7', 'sus4', 'sus2', 
    'add9', '9', 'm9', 'maj9', '6', 'm6', 'dim', 'dim7', 'aug'
  ];

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
              const chordCount = allChords.chords[root]?.length || 0;
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
                  <Text style={[
                    styles.rootButtonCount,
                    { color: isSelected ? theme.primaryText : theme.textSecondary }
                  ]}>
                    {chordCount}
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
            
            {/* Group by suffix */}
            {commonSuffixes.map((suffix) => {
              const chords = groupedChords[suffix] || [];
              if (chords.length === 0) return null;

              return (
                <View key={suffix} style={styles.suffixGroup}>
                  <Text style={[styles.suffixTitle, { color: theme.textSecondary }]}>
                    {getSuffixDisplayName(suffix) || 'Major'}
                  </Text>
                  <View style={styles.chordGrid}>
                    {chords.map((chord, idx) => {
                      const chordName = getChordDisplayName(chord.key, chord.suffix);
                      const positionCount = chord.positions?.length || 0;
                      return (
                        <TouchableOpacity
                          key={`${chord.key}-${chord.suffix}-${idx}`}
                          onPress={() => handleChordClick(chord.key, chord.suffix)}
                          style={[
                            styles.chordButton,
                            {
                              backgroundColor: theme.surface,
                              borderColor: theme.border,
                            }
                          ]}
                        >
                          <Text style={[styles.chordButtonText, { color: theme.text }]}>
                            {chordName}
                          </Text>
                          <Text style={[styles.chordButtonCount, { color: theme.textSecondary }]}>
                            {positionCount} {positionCount === 1 ? 'shape' : 'shapes'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Other suffixes */}
            {Object.keys(groupedChords)
              .filter(suffix => !commonSuffixes.includes(suffix))
              .map((suffix) => {
                const chords = groupedChords[suffix];
                return (
                  <View key={suffix} style={styles.suffixGroup}>
                    <Text style={[styles.suffixTitle, { color: theme.textSecondary }]}>
                      {suffix}
                    </Text>
                    <View style={styles.chordGrid}>
                      {chords.map((chord, idx) => {
                        const chordName = getChordDisplayName(chord.key, chord.suffix);
                        const positionCount = chord.positions?.length || 0;
                        return (
                          <TouchableOpacity
                            key={`${chord.key}-${chord.suffix}-${idx}`}
                            onPress={() => handleChordClick(chord.key, chord.suffix)}
                            style={[
                              styles.chordButton,
                              {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                              }
                            ]}
                          >
                            <Text style={[styles.chordButtonText, { color: theme.text }]}>
                              {chordName}
                            </Text>
                            <Text style={[styles.chordButtonCount, { color: theme.textSecondary }]}>
                              {positionCount} {positionCount === 1 ? 'shape' : 'shapes'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
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
  rootButtonCount: {
    fontSize: 11,
    marginTop: 2,
  },
  suffixGroup: {
    marginBottom: 20,
  },
  suffixTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chordButton: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  chordButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chordButtonCount: {
    fontSize: 11,
    marginTop: 2,
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

