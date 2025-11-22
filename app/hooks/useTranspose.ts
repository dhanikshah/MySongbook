/**
 * Hook for transposing song text
 */

import { useState, useCallback, useEffect } from 'react';
import { transposeSongText } from '../utils/chordTranspose';

export function useTranspose(initialText: string) {
  const [baseText, setBaseText] = useState(initialText);
  const [transposeSteps, setTransposeSteps] = useState(0);

  // Update base text when initialText changes
  useEffect(() => {
    setBaseText(initialText);
    setTransposeSteps(0);
  }, [initialText]);

  // Calculate transposed text
  const text = transposeSteps === 0 
    ? baseText 
    : transposeSongText(baseText, transposeSteps);

  const transpose = useCallback((steps: number) => {
    setTransposeSteps(prevSteps => {
      const newSteps = prevSteps + steps;
      return newSteps;
    });
  }, []);

  const transposeUp = useCallback(() => {
    transpose(1);
  }, [transpose]);

  const transposeDown = useCallback(() => {
    transpose(-1);
  }, [transpose]);

  const reset = useCallback(() => {
    setTransposeSteps(0);
  }, []);

  return {
    text,
    transposeSteps,
    transposeUp,
    transposeDown,
    reset,
  };
}

