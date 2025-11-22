import React from 'react';
import { ScrollView, Text, StyleSheet, Platform, View } from 'react-native';
import { CHORD_PATTERN } from '../utils/chordTranspose';

interface ChordTextViewProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
}

/**
 * Parse text and render chords in different color
 */
function renderTextWithChords(text: string, fontSize: number, fontFamily: string) {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const parts: Array<{ text: string; isChord: boolean }> = [];
    let lastIndex = 0;
    let match;
    
    // Reset regex
    CHORD_PATTERN.lastIndex = 0;
    
    while ((match = CHORD_PATTERN.exec(line)) !== null) {
      // Add text before chord
      if (match.index > lastIndex) {
        parts.push({
          text: line.substring(lastIndex, match.index),
          isChord: false,
        });
      }
      
      // Add chord
      parts.push({
        text: match[0],
        isChord: true,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last chord
    if (lastIndex < line.length) {
      parts.push({
        text: line.substring(lastIndex),
        isChord: false,
      });
    }
    
    // If no chords found, add entire line as text
    if (parts.length === 0) {
      parts.push({
        text: line,
        isChord: false,
      });
    }
    
    return (
      <Text 
        key={lineIndex} 
        style={[
          styles.line,
          {
            fontFamily: fontFamily,
            fontSize: fontSize,
            lineHeight: fontSize * 1.5,
          },
        ]}
      >
        {parts.map((part, partIndex) => (
          <Text
            key={partIndex}
            style={[
              styles.baseText,
              part.isChord ? styles.chordText : styles.lyricText,
            ]}
            className={part.isChord ? 'dark:text-blue-400' : 'dark:text-gray-100'}
          >
            {part.text}
          </Text>
        ))}
        {'\n'}
      </Text>
    );
  });
}

export function ChordTextView({ text, fontSize = 16, fontFamily = 'monospace' }: ChordTextViewProps) {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View style={styles.textContainer}>
        {renderTextWithChords(text, fontSize, fontFamily)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  textContainer: {
    // Web-specific styles handled via className
  },
  line: {
    // Web-specific styles handled via className
  },
  baseText: {
    ...(Platform.OS === 'web' && {
      fontFamily: 'monospace, "Courier New", monospace',
    }),
  },
  chordText: {
    color: '#2563EB', // Blue for chords
    fontWeight: '600',
    ...(Platform.OS === 'web' && {
      color: '#3B82F6', // Slightly lighter blue for web
    }),
  },
  lyricText: {
    color: '#1F2937', // Dark gray for lyrics
    ...(Platform.OS === 'web' && {
      color: '#1F2937',
    }),
  },
});

