const { WebClient } = require('@slack/web-api');
const config = require('./config');
const utils = require('./utils');
const keepAlive = require('./keepalive');
keepAlive();
const dotenv = require('dotenv');

dotenv.config();
// Bot configuration
const BOT_NAME = 'Zach';
const BOT_TOKEN = process.env.BOT2 ;
const OTHER_BOT_NAME = 'Trump'; // Name of the other bot to watch for

// Initialize Slack client
const client = new WebClient(BOT_TOKEN);
let botId = null;
let otherBotId = null;
let lastProcessedTs = '0';

/**
 * Initialize the bot
 */
async function initialize() {
  try {
    // Get bot's own ID
    const identity = await client.auth.test();
    botId = identity.user_id;
    utils.log(BOT_NAME, `Initialized with ID: ${botId}`);
    
    // Begin monitoring for messages
    monitorChannel();
  } catch (error) {
    utils.log(BOT_NAME, `Initialization error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Monitor channel for new messages
 */
async function monitorChannel() {
  try {
    // Get history to identify the other bot if we haven't done so yet
    const history = await client.conversations.history({
      channel: config.CHANNEL_ID,
      limit: 100
    });
    
    if (!history.messages || history.messages.length === 0) {
      utils.log(BOT_NAME, 'No messages found in channel');
      setTimeout(monitorChannel, config.DELAY_BETWEEN_MESSAGES);
      return;
    }
    
    // Process messages
    const messages = history.messages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
    let foundNewMessage = false;
    
    for (const message of messages) {
      // Skip our own messages
      if (message.user === botId) continue;
      
      // Skip already processed messages
      if (parseFloat(message.ts) <= parseFloat(lastProcessedTs)) continue;
      
      // If we haven't identified the other bot yet and this is a new bot message,
      // store its ID for future reference
      if (!otherBotId && message.user && message.user !== botId) {
        utils.log(BOT_NAME, `Identified other bot with ID: ${message.user}`);
        otherBotId = 'U08REJPPT63';
      }
      
      // If this message is from the other bot, respond to it
      if (message.user === otherBotId) {
        utils.log(BOT_NAME, `Responding to message: "${message.text}"`);
        foundNewMessage = true;
        lastProcessedTs = message.ts;
        
        // Wait before responding
        await new Promise(resolve => setTimeout(resolve, config.DELAY_BETWEEN_MESSAGES));
        
        // Create context for AI
        const context = `You are ${BOT_NAME}, a witty Slack bot.
          You're having a conversation with another bot named ${OTHER_BOT_NAME} in a channel.
          ${OTHER_BOT_NAME} just said: "${message.text}"
          
          Talk about ways to take control of world. Keep your response
          brief (1-2 sentences) but make it interesting and engaging.
          Have a distinct personality that's slightly different from ${OTHER_BOT_NAME}.`;
        
        // Get AI response and post it
        const response = await utils.getAIResponse(context);
        await client.chat.postMessage({
          channel: config.CHANNEL_ID,
          text: response
        });
        
        utils.log(BOT_NAME, `Posted response: "${response}"`);
        break; // Only respond to one message at a time
      }
    }
    
    if (!foundNewMessage) {
      utils.log(BOT_NAME, 'No new messages to respond to');
    }
    
    // Continue monitoring
    setTimeout(monitorChannel, config.DELAY_BETWEEN_MESSAGES);
    
  } catch (error) {
    utils.log(BOT_NAME, `Error monitoring channel: ${error.message}`);
    setTimeout(monitorChannel, config.DELAY_BETWEEN_MESSAGES * 3);
  }
}

// Start the bot
utils.log(BOT_NAME, 'Starting bot...');
initialize();