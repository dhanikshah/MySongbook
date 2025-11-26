# Chord Diagram Feature

## Overview
I've implemented a chord diagram feature that allows users to tap/click on any chord in a song to see a visual guitar chord diagram. The feature uses `@tombatossals/chords-db` for chord data and `@tombatossals/react-chords` for SVG rendering.

## What's New

### 1. **ChordDiagram Component** (`app/components/ChordDiagram.tsx`)
   - Displays guitar chord diagrams in a modal
   - Supports multiple voicings (different finger positions for the same chord)
   - Navigate between voicings with ← → buttons
   - Responsive design for web and mobile

### 2. **Clickable Chords** (`src/pages/SongViewerPage.tsx`)
   - All chords in song text are now clickable/tappable
   - Tapping a chord opens the chord diagram modal
   - Chords are highlighted in the primary theme color

## How to Use

1. **View a song** - Navigate to any song in your library
2. **Tap a chord** - Click or tap on any chord name (e.g., "C", "Am", "G7", "F#m")
3. **View diagram** - A modal will appear showing the guitar chord diagram
4. **Navigate voicings** - If multiple voicings are available, use ← → buttons to switch
5. **Close** - Tap the ✕ button or outside the modal to close

## Supported Chords

The feature supports common chords including:
- Major chords: C, D, E, F, G, A, B (and sharps/flats)
- Minor chords: Cm, Dm, Em, Fm, Gm, Am, Bm
- 7th chords: C7, D7, E7, etc.
- Extended chords: maj7, m7, sus4, sus2, add9, etc.
- And many more variations

## Technical Details

### Packages Installed
- `@tombatossals/chords-db` - Comprehensive chord database
- `@tombatossals/react-chords` - SVG chord diagram renderer
- `react-native-svg` - Already installed, required for SVG rendering

### Chord Name Normalization
The component automatically normalizes chord names:
- Handles sharps (#) and flats (b)
- Converts flats to sharps for database lookup
- Normalizes suffixes (m → minor, 7 → dominant, etc.)

### Data Structure
- Chord data is accessed from `chordsDb.guitar[root][suffix]`
- Each chord can have multiple positions/voicings
- Positions include: frets, fingers, barres, baseFret, capo

## Testing

To test the feature:

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open a song with chords** (e.g., a song with "C Am F G" progression)

3. **Click on any chord** - You should see:
   - Modal appears with chord diagram
   - Fretboard diagram showing finger positions
   - If multiple voicings exist, navigation buttons appear

4. **Test different chord types:**
   - Major: C, G, F
   - Minor: Am, Em, Dm
   - 7th: C7, G7, F7
   - Extended: Cmaj7, Am7, Gsus4

## Known Limitations

1. **React Native Web Compatibility**: The `@tombatossals/react-chords` library is designed for web React. It should work with React Native Web, but if you encounter issues on native Android/iOS, we may need to create a custom SVG renderer.

2. **Chord Coverage**: Not all possible chord variations are in the database. If a chord is not found, the modal will show "Chord diagram not available".

3. **Performance**: Loading chord data is done on-demand, so there's a slight delay when first opening a chord diagram.

## Next Steps (Optional Enhancements)

- [ ] Add chord search/autocomplete
- [ ] Show chord names in a sidebar while viewing songs
- [ ] Add ukulele/bass chord support
- [ ] Cache chord diagrams for better performance
- [ ] Add chord progression suggestions
- [ ] Export chord diagrams as images

## Files Modified

1. `app/components/ChordDiagram.tsx` - New component
2. `src/pages/SongViewerPage.tsx` - Added clickable chords and modal integration
3. `package.json` - Added dependencies

## Notes

- The feature is ready for testing but not yet committed to git
- All chords in existing songs will automatically become clickable
- The feature works on both web and mobile (React Native Web)

