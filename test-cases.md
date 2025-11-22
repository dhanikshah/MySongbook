# Test Cases for My Songbook App

## Test Execution Log

### 1. Backend API Tests

#### Test 1.1: Health Check
- **Status**: ✅ PASS
- **Result**: Backend responds with `{"status":"ok"}`

#### Test 1.2: Get All Songs (Empty)
- **Endpoint**: `GET /api/songs`
- **Expected**: Empty array `[]`
- **Status**: ⏳ PENDING (needs manual test)

#### Test 1.3: Create Song
- **Endpoint**: `POST /api/songs`
- **Status**: ⏳ PENDING (needs manual test)

### 2. Frontend Tests

#### Test 2.1: App Loads in Web Browser
- **Status**: ⏳ TESTING
- **Expected**: Home screen displays with "My Songbook" title
- **Issues Found**: 
  - Missing react-dom (FIXED)
  - expo-router plugin conflict (FIXED)

#### Test 2.2: Error Handling
- **Status**: ✅ IMPLEMENTED
- **Result**: Error messages display when backend is unavailable

#### Test 2.3: Navigation
- **Status**: ⏳ PENDING
- **Tests**: 
  - Navigate to Add Song
  - Navigate to Library
  - Navigate to Settings

### 3. OCR Functionality

#### Test 3.1: File Upload
- **Status**: ⏳ PENDING
- **Tests**:
  - Upload PDF
  - Upload Image (JPG/PNG)
  - Upload DOCX
  - Upload TXT

#### Test 3.2: Text Extraction
- **Status**: ⏳ PENDING
- **Expected**: Text extracted and displayed in editable field

### 4. Chord Transposition

#### Test 4.1: Simple Chords (C, G, D)
- **Status**: ⏳ PENDING
- **Test**: Transpose "C G D" up 1 semitone → "C# G# D#"

#### Test 4.2: Minor Chords (Em, Am)
- **Status**: ⏳ PENDING
- **Test**: Transpose "Em Am" up 2 semitones → "F#m Bm"

#### Test 4.3: Slash Chords (D/F#)
- **Status**: ⏳ PENDING
- **Test**: Transpose "D/F#" up 1 semitone → "D#/G"

#### Test 4.4: Complex Chords (Bbmaj7, G#dim)
- **Status**: ⏳ PENDING
- **Test**: Transpose complex jazz chords correctly

### 5. Search and Filter

#### Test 5.1: Search by Title
- **Status**: ⏳ PENDING

#### Test 5.2: Filter by Type
- **Status**: ⏳ PENDING

#### Test 5.3: Filter by Key
- **Status**: ⏳ PENDING

#### Test 5.4: Filter by Tags
- **Status**: ⏳ PENDING

### 6. Formatting Preservation

#### Test 6.1: Line Breaks
- **Status**: ⏳ PENDING
- **Expected**: Line breaks preserved in chord text

#### Test 6.2: Spacing
- **Status**: ⏳ PENDING
- **Expected**: Spacing and alignment preserved

## Next Steps

1. Complete web server startup
2. Test all UI components render correctly
3. Test API integration
4. Test OCR with sample files
5. Test chord transposition with various inputs
6. Test search and filtering

