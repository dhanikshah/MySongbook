/**
 * Text formatting utilities for song display
 */

/**
 * Preserve whitespace and line breaks for chord text
 */
export function formatChordText(text: string): string {
  // Preserve all whitespace and line breaks
  return text;
}

/**
 * Clean and normalize text input
 */
export function cleanText(text: string): string {
  return text.trim();
}

/**
 * Format text for display with proper line breaks
 */
export function formatForDisplay(text: string): string {
  return text.split('\n').map(line => line.trimEnd()).join('\n');
}

