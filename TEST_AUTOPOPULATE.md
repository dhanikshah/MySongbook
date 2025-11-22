# How to Test Auto-populate Feature

## Method 1: Automated Test (Backend)

Run the automated test script:

```bash
./test-autopopulate.sh
```

This tests:
- ✅ File upload endpoint
- ✅ Text extraction
- ✅ Song creation with extracted text

**Expected output:** All tests should pass ✅

## Method 2: Manual Testing in Browser (Frontend)

### Prerequisites
1. Backend must be running: `cd backend && npm run dev`
2. Frontend must be running: `npm run dev`
3. Open browser to: `http://localhost:8081`

### Steps

1. **Open Add Song Screen**
   - Click "Add Song" button on home screen
   - Or navigate to Add Song screen

2. **Upload a File**
   - Click "Pick Document" button
   - Select a file:
     - **TXT file** (recommended for testing)
     - **PDF file** (if you have one)
     - **Image file** (JPG/PNG - will use OCR)

3. **Watch for Auto-population**
   - After file upload, you should see:
     - "Extracting text..." message
     - Success alert: "Text extracted from file (X lines)!"
     - **Text should automatically appear in "Song Text" field**

4. **Verify the Text**
   - Check that the "Song Text" field is populated
   - You should see a green checkmark with line count
   - Text should match the content of your uploaded file

5. **Complete the Form**
   - Fill in Title (e.g., "Test Song")
   - Fill in Artist (e.g., "Test Artist")
   - Select Type (chords/lyrics/tabs)
   - Select Key
   - Add tags (optional)

6. **Save the Song**
   - Click "Save Song" button
   - Should see success message
   - Song should appear in library

### What to Check

✅ **Console Logs** (F12 → Console tab):
- `handleFile called with...`
- `Extraction result...`
- `Calling onTextExtracted...`
- `=== handleTextExtracted CALLED ===`
- `State updated successfully`

✅ **Network Tab** (F12 → Network tab):
- Request to `/api/songs/upload` should return 200
- Response should contain `{"text": "..."}`

✅ **UI Elements**:
- Text appears in "Song Text" field
- Green checkmark with line count appears
- Success alert is shown

## Method 3: Create Test File

Create a test file to upload:

```bash
# Create a test TXT file
cat > /tmp/test-song.txt << 'SONG'
C          G          Am         F
Verse 1
This is a test song
C          G          Am         F
With chords and lyrics
SONG
```

Then upload this file in the browser.

## Troubleshooting

### If text doesn't appear:

1. **Check Console (F12)**
   - Look for error messages
   - Check if `onTextExtracted` is being called
   - Verify API response

2. **Check Network Tab**
   - Is upload request successful? (200 status)
   - Does response contain `text` field?
   - Any CORS errors?

3. **Check Backend**
   - Is backend running? `curl http://localhost:3001/api/songs`
   - Check backend console for errors

4. **Verify File Type**
   - Supported: PDF, TXT, DOCX, JPG, PNG
   - File must have readable text content

### Common Issues

**Issue:** "No text extracted"
- **Fix:** Try a different file or check file has text content

**Issue:** "Upload failed"
- **Fix:** Check backend is running and CORS is configured

**Issue:** Text appears but disappears
- **Fix:** Check React state updates in console

## Quick Test Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 8081
- [ ] Browser console open (F12)
- [ ] Test file ready (TXT or PDF)
- [ ] Upload file via "Pick Document"
- [ ] See "Extracting text..." message
- [ ] See success alert
- [ ] Text appears in "Song Text" field
- [ ] Can save song with extracted text

## Expected Behavior

When you upload a file:
1. ⏳ "Extracting text..." appears
2. ✅ Success alert: "Text extracted from file (X lines)!"
3. 📝 Text automatically populates in "Song Text" field
4. ✓ Green checkmark shows line count
5. ✏️ You can edit the text if needed
6. 💾 You can save the song

