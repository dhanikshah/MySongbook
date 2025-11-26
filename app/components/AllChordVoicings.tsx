import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Svg, { Line, Circle, Text as SvgText, G } from 'react-native-svg';

interface AllChordVoicingsProps {
  chordName: string;
  allVoicings: any[];
}

// Extract the SVG rendering logic from ChordDiagram
function ChordDiagramSVG({ chord }: { chord: any }) {
  const { theme } = useTheme();
  
  if (!chord || !chord.frets) {
    return null;
  }
  
  const width = 150;
  const height = 180;
  const stringCount = 6;
  const fretCount = 4;
  const stringSpacing = 22;
  const fretSpacing = 35;
  const startX = 30;
  const startY = 30;
  const nutY = startY;
  const stringWidth = 2;
  const fretWidth = 2;
  const circleRadius = 6;
  
  let frets: any = chord.frets;
  let fingers: (number | undefined | null)[] = [];
  if (Array.isArray(chord.fingers)) {
    fingers = chord.fingers;
  }
  const barres = Array.isArray(chord.barres) ? chord.barres : [];
  const baseFret = chord.baseFret || 1;
  
  // Convert frets to array format
  let fretsArray: (number | null)[] = [];
  if (typeof frets === 'string') {
    fretsArray = frets.split('').map(f => {
      if (f === 'x' || f === 'X' || f === '-') return null;
      const num = parseInt(f, 10);
      return isNaN(num) ? null : num;
    });
  } else if (Array.isArray(frets)) {
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
  while (fingers.length < stringCount) {
    fingers.push(undefined);
  }
  fingers = fingers.slice(0, stringCount);
  
  // Calculate actual fret positions
  const validFrets = fretsArray.filter((f): f is number => f !== null && f >= 0);
  const hasOpenStrings = fretsArray.some(f => f === 0);
  const minFret = validFrets.length > 0 ? Math.min(...validFrets.filter(f => f > 0)) : 1;
  
  const chordBaseFret = chord.baseFret || 1;
  const showBaseFret = chordBaseFret > 1 || (minFret > 1 && !hasOpenStrings);
  const actualBaseFret = chordBaseFret > 1 ? chordBaseFret : (minFret > 1 && !hasOpenStrings ? minFret : 1);
  
  // When baseFret > 1, the frets in the database are already relative to baseFret
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
        const stringsWithBarre: number[] = [];
        adjustedFrets.forEach((fret, stringIdx) => {
          if (fret === barreFret && fret !== null && fret > 0) {
            stringsWithBarre.push(stringIdx);
          }
        });
        
        if (stringsWithBarre.length < 2) return null;
        
        const startString = Math.min(...stringsWithBarre);
        const endString = Math.max(...stringsWithBarre);
        const yPos = nutY + barreFret * fretSpacing;
        
        return (
          <Line
            key={`barre-${idx}`}
            x1={startX + startString * stringSpacing}
            y1={yPos}
            x2={startX + endString * stringSpacing}
            y2={yPos}
            stroke={theme.text}
            strokeWidth={10}
            strokeLinecap="round"
          />
        );
      })}
      
      {/* Fingered notes */}
      {adjustedFrets.map((adjustedFret, stringIndex) => {
        const originalFret = fretsArray[stringIndex];
        
        if (originalFret === null || originalFret < 0) {
          return (
            <G key={`mute-${stringIndex}`}>
              <Line
                x1={startX + stringIndex * stringSpacing - 6}
                y1={nutY - 15}
                x2={startX + stringIndex * stringSpacing + 6}
                y2={nutY - 5}
                stroke={theme.text}
                strokeWidth={1.5}
              />
              <Line
                x1={startX + stringIndex * stringSpacing - 6}
                y1={nutY - 5}
                x2={startX + stringIndex * stringSpacing + 6}
                y2={nutY - 15}
                stroke={theme.text}
                strokeWidth={1.5}
              />
            </G>
          );
        }
        
        if (originalFret === 0) {
          return (
            <Circle
              key={`open-${stringIndex}`}
              cx={startX + stringIndex * stringSpacing}
              cy={nutY - 12}
              r={4}
              fill="none"
              stroke={theme.text}
              strokeWidth={1.5}
            />
          );
        }
        
        if (adjustedFret === null || adjustedFret < 0) {
          return null;
        }
        
        const finger = (stringIndex < fingers.length && 
                       fingers[stringIndex] !== undefined && 
                       fingers[stringIndex] !== null) 
          ? fingers[stringIndex] 
          : undefined;
        const yPos = nutY + adjustedFret * fretSpacing;
        const showFingerNumber = finger !== undefined && finger !== null && finger > 0;
        
        return (
          <G key={`finger-${stringIndex}`}>
            <Circle
              cx={startX + stringIndex * stringSpacing}
              cy={yPos}
              r={circleRadius}
              fill={theme.primary}
              stroke={theme.text}
              strokeWidth={1.5}
            />
            {showFingerNumber && (
              <SvgText
                x={startX + stringIndex * stringSpacing}
                y={yPos + 4}
                fontSize="10"
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
          x={startX - 18}
          y={nutY + fretSpacing * 0.5 + 4}
          fontSize="11"
          fill={theme.text}
          fontWeight="bold"
        >
          {actualBaseFret}fr
        </SvgText>
      )}
    </Svg>
  );
}

export function AllChordVoicings({ chordName, allVoicings }: AllChordVoicingsProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = Platform.OS !== 'web' && width < 768;
  
  // Calculate how many columns to show based on screen width
  const columns = isMobile ? 2 : (width < 1200 ? 3 : 4);
  const itemWidth = (width - (isMobile ? 32 : 48) - (columns - 1) * 16) / columns;
  
  if (allVoicings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No voicings available for "{chordName}"
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {chordName} - All Voicings ({allVoicings.length})
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {allVoicings.length} {allVoicings.length === 1 ? 'voicing' : 'voicings'} available
        </Text>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && { paddingBottom: 20 } // Extra padding on mobile
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.grid, { 
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        }]}>
          {allVoicings.map((voicing, index) => (
            <View
              key={index}
              style={[
                styles.voicingCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  width: itemWidth,
                  minWidth: isMobile ? 140 : 150,
                  maxWidth: isMobile ? 180 : 200,
                }
              ]}
            >
              <View style={styles.voicingHeader}>
                <Text style={[styles.voicingNumber, { color: theme.textSecondary }]}>
                  Voicing {index + 1}
                </Text>
                {voicing.baseFret > 1 && (
                  <Text style={[styles.baseFretLabel, { color: theme.textSecondary }]}>
                    {voicing.baseFret}fr
                  </Text>
                )}
              </View>
              <View style={styles.diagramContainer}>
                <ChordDiagramSVG chord={voicing} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 24 : 12,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
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
  grid: {
    width: '100%',
  },
  voicingCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Platform.OS === 'web' ? 12 : 8,
    alignItems: 'center',
  },
  voicingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  voicingNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  baseFretLabel: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  diagramContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

