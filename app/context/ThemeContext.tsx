import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryText: string;
  error: string;
  errorText: string;
  card: string;
  cardBorder: string;
  input: string;
  inputBorder: string;
  tag: string;
  tagText: string;
  selected: string;
  selectedBorder: string;
}

const lightTheme: ThemeColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#6c757d',
  border: '#e0e0e0',
  primary: '#6366f1', // Indigo - modern and vibrant
  primaryText: '#ffffff',
  error: '#ef4444',
  errorText: '#ffffff',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  input: '#ffffff',
  inputBorder: '#d1d5db',
  tag: '#f3f4f6',
  tagText: '#374151',
  selected: '#eef2ff',
  selectedBorder: '#6366f1',
};

const darkTheme: ThemeColors = {
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  primary: '#0a84ff',
  primaryText: '#ffffff',
  error: '#ff453a',
  errorText: '#ffffff',
  card: '#1e1e1e',
  cardBorder: '#333333',
  input: '#1e1e1e',
  inputBorder: '#444444',
  tag: '#2e2e2e',
  tagText: '#ffffff',
  selected: '#1a3a5c',
  selectedBorder: '#0a84ff',
};

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always use light theme - no theme switching
  const themeMode: ThemeMode = 'light';
  const isDark = false;
  const theme = lightTheme;

  const setThemeMode = async (mode: ThemeMode) => {
    // Theme switching disabled - always use light theme
    // This function is kept for API compatibility but does nothing
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

