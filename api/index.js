// Vercel serverless function wrapper for Express backend
const path = require('path');

// Load environment variables from Vercel
require('dotenv').config();

// Import the compiled Express app
const express = require('express');
const cors = require('cors');

// Import compiled routes from backend
const chatRoutes = require('../backend/dist/routes/chat.routes').default;
const videoRoutes = require('../backend/dist/routes/video.routes').default;
const audioRoutes = require('../backend/dist/routes/audio.routes').default;
const calendarRoutes = require('../backend/dist/routes/calendar.routes').default;
const emailRoutes = require('../backend/dist/routes/email.routes').default;
const profileRoutes = require('../backend/dist/routes/profile.routes').default;
const qualificationRoutes = require('../backend/dist/routes/qualification.routes').default;
const avatarRoutes = require('../backend/dist/routes/avatar.routes').default;
const logsRoutes = require('../backend/dist/routes/logs.routes').default;

const { knowledgeService } = require('../backend/dist/services/knowledge.service');
const { llmService } = require('../backend/dist/services/llm.service');
const { conversationLogService } = require('../backend/dist/services/conversation-log.service');

const app = express();

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'https://*.vercel.app']
  : ['*'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/qualification', qualificationRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize services once (Vercel will cache this)
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    try {
      await knowledgeService.initialize();
      await llmService.initialize();
      await conversationLogService.initialize();
      initialized = true;
      console.log('Services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }
  }
}

// Export for Vercel serverless
module.exports = async (req, res) => {
  await ensureInitialized();
  return app(req, res);
};

// Also export the app for local testing
module.exports.app = app;
