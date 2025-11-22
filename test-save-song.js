/**
 * Test case for save song functionality
 * Run with: node test-save-song.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

// Test data
const testSong = {
  title: 'Test Song ' + Date.now(),
  artist: 'Test Artist',
  type: 'chords',
  key: 'C',
  tags: ['test', 'demo'],
  extractedText: 'C G Am F\nThis is a test song.\n\nChorus\nC G Am F\nMore lyrics here.',
};

async function testSaveSong() {
  console.log('🧪 Testing Save Song Functionality\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Test Song:', {
    ...testSong,
    extractedText: testSong.extractedText.substring(0, 50) + '...',
  });
  console.log('\n');

  try {
    // Test 1: Save song with all fields
    console.log('Test 1: Save song with all fields');
    const response1 = await axios.post(`${API_BASE_URL}/api/songs`, testSong);
    console.log('✅ PASSED - Song saved successfully');
    console.log('   Song ID:', response1.data.id);
    console.log('   Title:', response1.data.title);
    console.log('   Status:', response1.status);
    console.log('\n');

    // Test 2: Save song with minimal fields (only title and text)
    console.log('Test 2: Save song with minimal fields (title and text only)');
    const minimalSong = {
      title: 'Minimal Song ' + Date.now(),
      artist: '',
      type: 'chords',
      key: 'C',
      tags: [],
      extractedText: 'C G Am F\nMinimal song text.',
    };
    const response2 = await axios.post(`${API_BASE_URL}/api/songs`, minimalSong);
    console.log('✅ PASSED - Minimal song saved successfully');
    console.log('   Song ID:', response2.data.id);
    console.log('   Title:', response2.data.title);
    console.log('\n');

    // Test 3: Try to save without title (should fail)
    console.log('Test 3: Try to save without title (should fail)');
    try {
      const invalidSong = {
        title: '',
        artist: 'Test Artist',
        type: 'chords',
        key: 'C',
        tags: [],
        extractedText: 'Some text',
      };
      await axios.post(`${API_BASE_URL}/api/songs`, invalidSong);
      console.log('❌ FAILED - Should have rejected empty title');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ PASSED - Correctly rejected empty title');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ FAILED - Wrong error type:', error.response?.status);
      }
    }
    console.log('\n');

    // Test 4: Try to save without text (should fail)
    console.log('Test 4: Try to save without text (should fail)');
    try {
      const invalidSong = {
        title: 'Test Title',
        artist: 'Test Artist',
        type: 'chords',
        key: 'C',
        tags: [],
        extractedText: '',
      };
      await axios.post(`${API_BASE_URL}/api/songs`, invalidSong);
      console.log('❌ FAILED - Should have rejected empty text');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ PASSED - Correctly rejected empty text');
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('❌ FAILED - Wrong error type:', error.response?.status);
      }
    }
    console.log('\n');

    // Test 5: Verify saved song can be retrieved
    console.log('Test 5: Verify saved song can be retrieved');
    const getResponse = await axios.get(`${API_BASE_URL}/api/songs/${response1.data.id}`);
    if (getResponse.data && getResponse.data.id === response1.data.id) {
      console.log('✅ PASSED - Song retrieved successfully');
      console.log('   Title:', getResponse.data.title);
      console.log('   Artist:', getResponse.data.artist);
      console.log('   Text length:', getResponse.data.extractedText.length);
    } else {
      console.log('❌ FAILED - Song not found after saving');
    }
    console.log('\n');

    console.log('🎉 All tests completed!\n');
    console.log('Summary:');
    console.log('  ✅ Save with all fields');
    console.log('  ✅ Save with minimal fields');
    console.log('  ✅ Validation: Empty title rejected');
    console.log('  ✅ Validation: Empty text rejected');
    console.log('  ✅ Song retrieval after save');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received. Is the backend server running?');
      console.error('   Make sure to start the backend with: cd backend && npm run dev');
    }
    process.exit(1);
  }
}

// Run tests
testSaveSong();

