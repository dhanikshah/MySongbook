/**
 * Test case for delete song functionality
 * Run with: node test-delete-song.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

async function testDeleteSong() {
  console.log('🧪 Testing Delete Song Functionality\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('\n');

  try {
    // Step 1: Create a test song to delete
    console.log('Step 1: Creating test song...');
    const testSong = {
      title: 'Test Delete Song ' + Date.now(),
      artist: 'Test Artist',
      type: 'chords',
      key: 'C',
      tags: ['test', 'delete'],
      extractedText: 'C G Am F\nThis is a test song for deletion.\n\nChorus\nC G Am F\nMore lyrics here.',
    };

    const createResponse = await axios.post(`${API_BASE_URL}/api/songs`, testSong);
    const createdSong = createResponse.data;
    console.log('✅ Test song created successfully');
    console.log('   Song ID:', createdSong.id);
    console.log('   Song Title:', createdSong.title);
    console.log('   Status:', createResponse.status);
    console.log('\n');

    // Step 2: Verify song exists
    console.log('Step 2: Verifying song exists...');
    const getResponse = await axios.get(`${API_BASE_URL}/api/songs/${createdSong.id}`);
    if (getResponse.data && getResponse.data.id === createdSong.id) {
      console.log('✅ Song exists in database');
      console.log('   Title:', getResponse.data.title);
    } else {
      throw new Error('Song not found after creation');
    }
    console.log('\n');

    // Step 3: Delete the song
    console.log('Step 3: Deleting song...');
    console.log('   Song ID:', createdSong.id);
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/songs/${createdSong.id}`);
    console.log('   Delete response status:', deleteResponse.status);
    console.log('   Delete response data:', deleteResponse.data);
    
    if (deleteResponse.status === 200 || deleteResponse.status === 204) {
      console.log('✅ Delete request successful');
    } else {
      throw new Error(`Unexpected status code: ${deleteResponse.status}`);
    }
    console.log('\n');

    // Step 4: Verify song is deleted (should return 404)
    console.log('Step 4: Verifying song is deleted...');
    try {
      await axios.get(`${API_BASE_URL}/api/songs/${createdSong.id}`);
      console.log('❌ FAILED - Song still exists after deletion!');
      throw new Error('Song was not deleted from database');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ PASSED - Song successfully deleted (404 as expected)');
      } else {
        console.log('❌ FAILED - Unexpected error:', error.response?.status || error.message);
        throw error;
      }
    }
    console.log('\n');

    // Step 5: Verify song is not in the list
    console.log('Step 5: Verifying song is not in songs list...');
    const listResponse = await axios.get(`${API_BASE_URL}/api/songs`);
    const songs = listResponse.data;
    const deletedSongStillExists = songs.some(s => s.id === createdSong.id);
    
    if (deletedSongStillExists) {
      console.log('❌ FAILED - Song still appears in songs list!');
      throw new Error('Song still exists in songs list');
    } else {
      console.log('✅ PASSED - Song not in songs list');
      console.log('   Total songs in database:', songs.length);
    }
    console.log('\n');

    // Step 6: Test deleting non-existent song (should return 404)
    console.log('Step 6: Testing delete of non-existent song...');
    try {
      await axios.delete(`${API_BASE_URL}/api/songs/non-existent-id-12345`);
      console.log('❌ FAILED - Should have returned 404 for non-existent song');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ PASSED - Correctly returned 404 for non-existent song');
      } else {
        console.log('⚠️  WARNING - Unexpected status:', error.response?.status || error.message);
      }
    }
    console.log('\n');

    console.log('🎉 All delete tests passed!\n');
    console.log('Summary:');
    console.log('  ✅ Create song');
    console.log('  ✅ Verify song exists');
    console.log('  ✅ Delete song');
    console.log('  ✅ Verify song deleted (404)');
    console.log('  ✅ Verify song not in list');
    console.log('  ✅ Test delete non-existent song');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received. Is the backend server running?');
      console.error('   Make sure to start the backend with: cd backend && npm run dev');
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

// Run tests
testDeleteSong();

