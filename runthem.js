const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes for differentiating output
const colors = {
  bot1: '\x1b[36m', // Cyan
  bot2: '\x1b[35m', // Magenta
  system: '\x1b[33m', // Yellow
  reset: '\x1b[0m'   // Reset to default
};

console.log(`${colors.system}Starting both Slack bots...${colors.reset}`);

// Function to start a bot process
function startBot(botScript, botName) {
  console.log(`${colors.system}Launching ${botName}...${colors.reset}`);
  
  // Spawn the bot process
  const bot = spawn('node', [botScript], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Handle bot stdout (regular output)
  bot.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`${colors[botName]}[${botName}] ${line}${colors.reset}`);
    });
  });
  
  // Handle bot stderr (error output)
  bot.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.error(`${colors[botName]}[${botName} ERROR] ${line}${colors.reset}`);
    });
  });
  
  // Handle bot exit
  bot.on('close', (code) => {
    if (code !== 0) {
      console.error(`${colors.system}${botName} process exited with code ${code}${colors.reset}`);
      
      // Restart the bot after a delay
      console.log(`${colors.system}Restarting ${botName} in 5 seconds...${colors.reset}`);
      setTimeout(() => startBot(botScript, botName), 5000);
    } else {
      console.log(`${colors.system}${botName} process exited normally${colors.reset}`);
    }
  });
  
  // Store bot process
  return bot;
}

// Start both bots
const bot1Process = startBot('bot1.js', 'bot1');
const bot2Process = startBot('bot2.js', 'bot2');

// Handle script termination
process.on('SIGINT', () => {
  console.log(`${colors.system}Shutting down all bots...${colors.reset}`);
  
  // Kill both bot processes
  bot1Process.kill();
  bot2Process.kill();
  
  // Exit this script
  setTimeout(() => process.exit(0), 1000);
});

console.log(`${colors.system}Both bots are now running. Press Ctrl+C to stop.${colors.reset}`);