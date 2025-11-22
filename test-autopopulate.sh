#!/bin/bash

# Test Auto-populate Feature
# Tests that uploading a file (TXT, PDF) extracts text and can populate song text field
# This tests the backend functionality - frontend integration should work if backend works

API_BASE_URL="http://localhost:3001/api"
TEST_RESULTS=()

echo "=== Testing Auto-populate Feature ==="
echo ""

# Function to test file upload and extraction
test_file_upload() {
  local file_path=$1
  local file_type=$2
  local test_name=$3
  
  echo "Testing: $test_name"
  echo "  File: $file_path"
  echo "  Type: $file_type"
  
  UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE_URL/songs/upload" \
    -F "file=@$file_path" \
    -H "Content-Type: multipart/form-data")
  
  # Check for errors
  if echo "$UPLOAD_RESPONSE" | grep -q '"error"'; then
    ERROR_MSG=$(echo "$UPLOAD_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "  ❌ FAILED: $ERROR_MSG"
    TEST_RESULTS+=("$test_name: FAILED - $ERROR_MSG")
    return 1
  fi
  
  # Extract text from response
  EXTRACTED_TEXT=$(echo "$UPLOAD_RESPONSE" | grep -o '"text":"[^"]*"' | cut -d'"' -f4 || echo "")
  HAS_TEXT=$(echo "$UPLOAD_RESPONSE" | grep -c '"text"' || echo "0")
  
  if [ "$HAS_TEXT" -gt 0 ] && [ -n "$EXTRACTED_TEXT" ]; then
    TEXT_LENGTH=${#EXTRACTED_TEXT}
    echo "  ✅ SUCCESS: Text extracted"
    echo "  Text length: $TEXT_LENGTH characters"
    echo "  Text preview: ${EXTRACTED_TEXT:0:80}..."
    TEST_RESULTS+=("$test_name: PASSED - $TEXT_LENGTH chars extracted")
    echo "$EXTRACTED_TEXT"
    return 0
  else
    echo "  ❌ FAILED: No text extracted"
    echo "  Response: $UPLOAD_RESPONSE"
    TEST_RESULTS+=("$test_name: FAILED - No text extracted")
    return 1
  fi
}

# Test 1: TXT file upload
echo "Test 1: TXT File Upload and Extraction"
echo "--------------------------------------"
TEST_FILE="/tmp/test-song.txt"
cat > "$TEST_FILE" << 'SONG'
C          G          Am         F
Verse 1
This is a test song
C          G          Am         F
With chords and lyrics
SONG

if EXTRACTED_TEXT1=$(test_file_upload "$TEST_FILE" "text/plain" "TXT Upload"); then
  TEST_RESULTS+=("TXT Upload: PASSED")
else
  TEST_RESULTS+=("TXT Upload: FAILED")
  EXTRACTED_TEXT1=""
fi
echo ""

# Test 2: Create song with extracted text
if [ -n "$EXTRACTED_TEXT1" ]; then
  echo "Test 2: Create Song with Extracted Text"
  echo "----------------------------------------"
  
  # Escape text for JSON (handle newlines and quotes)
  ESCAPED_TEXT=$(echo "$EXTRACTED_TEXT1" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo "$EXTRACTED_TEXT1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
  
  # Use python for proper JSON encoding if available
  if command -v python3 &> /dev/null; then
    SONG_DATA=$(python3 <<PYTHON
import json
import sys

text = """$EXTRACTED_TEXT1"""

song = {
    "title": "Auto-populate Test Song",
    "artist": "Test Artist",
    "type": "chords",
    "key": "C",
    "tags": ["test", "autopopulate"],
    "extractedText": text
}

print(json.dumps(song))
PYTHON
)
  else
    # Fallback: simple escaping
    ESCAPED_TEXT=$(echo "$EXTRACTED_TEXT1" | sed 's/"/\\"/g' | tr '\n' '|' | sed 's/|/\\n/g')
    SONG_DATA=$(cat <<JSON
{
  "title": "Auto-populate Test Song",
  "artist": "Test Artist",
  "type": "chords",
  "key": "C",
  "tags": ["test", "autopopulate"],
  "extractedText": "$ESCAPED_TEXT"
}
JSON
)
  fi
  
  CREATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/songs" \
    -H "Content-Type: application/json" \
    -d "$SONG_DATA")
  
  SONG_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ -n "$SONG_ID" ]; then
    echo "  ✅ SUCCESS: Song created"
    echo "  Song ID: $SONG_ID"
    
    # Verify the song has the extracted text
    GET_RESPONSE=$(curl -s "$API_BASE_URL/songs/$SONG_ID")
    SONG_TEXT=$(echo "$GET_RESPONSE" | grep -o '"extractedText":"[^"]*"' | cut -d'"' -f4 || echo "")
    SONG_TEXT_UNESCAPED=$(echo "$SONG_TEXT" | sed 's/\\n/\n/g' | sed 's/\\"/"/g')
    
    if [ -n "$SONG_TEXT" ]; then
      echo "  ✅ SUCCESS: Song contains extracted text"
      TEST_RESULTS+=("Create Song: PASSED")
      
      # Cleanup
      DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_BASE_URL/songs/$SONG_ID")
      if [ "$DELETE_STATUS" = "204" ]; then
        echo "  ✅ Test song cleaned up"
      fi
    else
      echo "  ❌ FAILED: Song doesn't contain extracted text"
      TEST_RESULTS+=("Create Song: FAILED - No text in song")
    fi
  else
    echo "  ❌ FAILED: Could not create song"
    TEST_RESULTS+=("Create Song: FAILED - Creation failed")
  fi
  echo ""
fi

# Test 3: PDF file (if available)
echo "Test 3: PDF File Upload (if PDF support available)"
echo "--------------------------------------------------"
# Create a minimal PDF for testing
cat > /tmp/test.pdf << 'PDF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF Content) Tj
ET
endstream
endobj
xref
0 5
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF
PDF

if [ -f /tmp/test.pdf ]; then
  EXTRACTED_TEXT2=$(test_file_upload "/tmp/test.pdf" "application/pdf" "PDF Upload")
  echo ""
fi

# Summary
echo "=== Test Results Summary ==="
echo ""
for result in "${TEST_RESULTS[@]}"; do
  echo "  $result"
done
echo ""

PASSED=$(echo "${TEST_RESULTS[@]}" | grep -o "PASSED" | wc -l | tr -d ' ')
FAILED=$(echo "${TEST_RESULTS[@]}" | grep -o "FAILED" | wc -l | tr -d ' ')

echo "Total: $((PASSED + FAILED)) tests"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo "✅ All tests passed! Auto-populate feature is working correctly."
  exit 0
else
  echo "❌ Some tests failed. Check the output above for details."
  exit 1
fi
