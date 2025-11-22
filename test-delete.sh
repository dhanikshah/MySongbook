#!/bin/bash

# Test script for delete functionality
# This script tests that:
# 1. Songs can be deleted from the database
# 2. Deleted songs don't appear in the songs list
# 3. Deleted songs return 404 when accessed directly

API_BASE_URL="http://localhost:3001/api"

echo "=== Testing Delete Functionality ==="
echo ""

# 1. Get all songs
echo "1. Fetching all songs..."
ALL_SONGS=$(curl -s "$API_BASE_URL/songs")
SONG_COUNT=$(echo "$ALL_SONGS" | grep -o '"id"' | wc -l | tr -d ' ')
echo "   Found $SONG_COUNT songs"

if [ "$SONG_COUNT" -eq 0 ]; then
  echo "   ⚠️  No songs to delete. Please add a song first."
  echo "   Test will create a test song..."
  
  # Create a test song
  TEST_SONG=$(curl -s -X POST "$API_BASE_URL/songs" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Delete Song",
      "artist": "Test Artist",
      "type": "chords",
      "key": "C",
      "tags": ["test"],
      "extractedText": "C G Am F\nTest song for deletion"
    }')
  
  TEST_SONG_ID=$(echo "$TEST_SONG" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   Created test song with ID: $TEST_SONG_ID"
  sleep 1
else
  # 2. Get first song ID
  TEST_SONG_ID=$(echo "$ALL_SONGS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  TEST_SONG_TITLE=$(echo "$ALL_SONGS" | grep -o '"title":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo ""
  echo "2. Selected test song: \"$TEST_SONG_TITLE\" (ID: $TEST_SONG_ID)"
fi

# 3. Delete the song
echo ""
echo "3. Deleting song..."
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API_BASE_URL/songs/$TEST_SONG_ID")
echo "   Delete response status: $DELETE_STATUS"

if [ "$DELETE_STATUS" != "204" ] && [ "$DELETE_STATUS" != "200" ]; then
  echo "   ❌ FAILED: Delete returned status $DELETE_STATUS (expected 204 or 200)"
  exit 1
fi
echo "   ✅ Delete request successful"

# 4. Verify song is deleted (should get 404)
echo ""
echo "4. Verifying deletion..."
GET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/songs/$TEST_SONG_ID")
if [ "$GET_STATUS" == "404" ]; then
  echo "   ✅ SUCCESS: Song deleted from database (404 Not Found)"
else
  echo "   ❌ FAILED: Song still exists (got status $GET_STATUS, expected 404)"
  exit 1
fi

# 5. Check all songs list
echo ""
echo "5. Checking all songs list..."
SONGS_AFTER=$(curl -s "$API_BASE_URL/songs")
SONG_COUNT_AFTER=$(echo "$SONGS_AFTER" | grep -o '"id"' | wc -l | tr -d ' ')
DELETED_STILL_EXISTS=$(echo "$SONGS_AFTER" | grep -c "$TEST_SONG_ID" || echo "0")

if [ "$DELETED_STILL_EXISTS" != "0" ] && [ -n "$DELETED_STILL_EXISTS" ]; then
  echo "   ❌ FAILED: Deleted song still appears in songs list!"
  echo "   Found $SONG_COUNT_AFTER songs (expected $((SONG_COUNT - 1)))"
  exit 1
else
  echo "   ✅ SUCCESS: Deleted song removed from songs list"
  if [ "$SONG_COUNT" -gt 0 ]; then
    echo "   Found $SONG_COUNT_AFTER songs (was $SONG_COUNT)"
  else
    echo "   Found $SONG_COUNT_AFTER songs (was 0, created 1, deleted 1)"
  fi
fi

echo ""
echo "=== Test Complete: All checks passed! ✅ ==="
echo ""
echo "Summary:"
echo "  ✅ Delete endpoint returns 204"
echo "  ✅ Deleted song returns 404 when accessed"
echo "  ✅ Deleted song removed from songs list"
echo ""
echo "The delete functionality is working correctly!"

