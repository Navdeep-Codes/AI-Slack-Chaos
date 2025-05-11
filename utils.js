const axios = require('axios');
const config = require('./config');

/**
 * Get response from Hack Club AI API
 */
async function getAIResponse(message) {
  try {
    const response = await axios.post(config.AI_API_URL, {
      messages: [{ role: 'user', content: message }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      console.error('Unexpected API response structure:', JSON.stringify(response.data));
      return "I'm not sure what to say next.";
    }
  } catch (error) {
    console.error('Error getting AI response:', error.message);
    return "Sorry, I had an error processing that.";
  }
}

/**
 * Format current time for logging
 */
function getTimeFormatted() {
  return new Date().toISOString();
}

/**
 * Log with timestamp
 */
function log(botName, message) {
  console.log(`[${getTimeFormatted()}] [${botName}] ${message}`);
}

module.exports = {
  getAIResponse,
  log
};