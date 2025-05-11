const axios = require('axios');

async function testBookmarkCreation() {
  try {
    const API_URL = 'http://localhost:3001/api';
    
    const bookmarkData = {
      title: "Test Bookmark",
      category: "Technologia",
      group: "AI",
      status: "Do przeczytania",
      link: "https://example.com",
      summary: "Test summary",
      tags: ["test", "bookmark", "ai"].map(tag => ({ name: tag })),
      folder: { name: "Test Folder" }
    };
    
    console.log('Sending data:', JSON.stringify(bookmarkData, null, 2));
    
    const response = await axios.post(`${API_URL}/bookmarks`, bookmarkData);
    console.log('Response:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error creating bookmark:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

testBookmarkCreation(); 