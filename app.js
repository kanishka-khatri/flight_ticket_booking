// require('dotenv').config();
// const express = require('express');
// const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
// const { FlightBookingBot } = require('./bot/bot');

// const app = express();
// const PORT = process.env.PORT || 3978;

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Create adapter
// const adapter = new BotFrameworkAdapter({
//   appId: process.env.MICROSOFT_APP_ID || '',
//   appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
// });

// // Critical middleware to prevent version errors
// adapter.use(async (context, next) => {
//   context.turnState.set('skipChannelCall', true);
//   if (context.activity.value?.dialog) {
//     context.activity.value.dialog.version = '1.0.0';
//   }
//   await next();
// });

// // Error handling
// adapter.onTurnError = async (context, error) => {
//   console.error(`\n [onTurnError]: ${error}`);
//   await context.sendActivity('Something went wrong. Please try again later.');
  
//   // Clear conversation state on error
//   const conversationState = context.turnState.get('conversationState');
//   if (conversationState) {
//     await conversationState.delete(context);
//   }
// };

// // Create bot
// const memoryStorage = new MemoryStorage();
// const conversationState = new ConversationState(memoryStorage);
// const userState = new UserState(memoryStorage);
// const bot = new FlightBookingBot(conversationState, userState);

// // Endpoint
// app.post('/api/messages', async (req, res) => {
//   try {
//     await adapter.processActivity(req, res, async (context) => {
//       await bot.run(context);
//     });
//   } catch (err) {
//     console.error('Server error:', err);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Start server
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

require('dotenv').config();
const express = require('express');
const { BotFrameworkAdapter, MemoryStorage, ConversationState, UserState } = require('botbuilder');
const { FlightBookingBot } = require('./bot/bot');
const { pool, testConnection } = require('./database/mysql-config'); // Fixed import

const app = express();
const PORT = process.env.PORT || 3978;

// Database connection check
async function initializeDatabase() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Critical: Could not connect to database');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create adapter
const adapter = new BotFrameworkAdapter({
  appId: process.env.MICROSOFT_APP_ID || '',
  appPassword: process.env.MICROSOFT_APP_PASSWORD || ''
});

// Error handling
adapter.onTurnError = async (context, error) => {
    console.error(`\n[onTurnError]: ${error.stack}`);
    
    // Send a message to the user
    await context.sendActivity('Something went wrong. Please try again later.');
    
    // Clear conversation state
    const conversationState = context.turnState.get('conversationState');
    if (conversationState) {
        try {
            await conversationState.delete(context);
        } catch (err) {
            console.error('Error clearing conversation state:', err);
        }
    }
};

// Create bot
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);
const bot = new FlightBookingBot(conversationState, userState);

// Endpoint
app.post('/api/messages', async (req, res) => {
  try {
    await adapter.processActivity(req, res, async (context) => {
      await bot.run(context);
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const [flights] = await pool.query('SELECT COUNT(*) as count FROM flights');
        const [bookings] = await pool.query('SELECT COUNT(*) as count FROM bookings');
        
        res.json({
            status: 'OK',
            database: {
                flights: flights[0].count,
                bookings: bookings[0].count
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            error: error.message
        });
    }
});

// Initialize and start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});