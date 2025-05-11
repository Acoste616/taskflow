const axios = require('axios');

const LMSTUDIO_API_URL = 'http://localhost:1234/v1/chat/completions';

async function testLMStudio() {
  console.log('Testing connection to LM Studio at:', LMSTUDIO_API_URL);
  
  try {
    const response = await axios.post(LMSTUDIO_API_URL, {
      model: "Qwen-3-14B", // Use the model you have loaded
      messages: [{ role: "user", content: "Say hi" }],
      temperature: 0.3,
      max_tokens: 100,
    });

    // Log the response
    console.log('Connection successful! Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('Error connecting to LM Studio:');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testLMStudio(); 