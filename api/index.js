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
const contactRoutes = require('../backend/dist/routes/contact.routes').default;

const { knowledgeService } = require('../backend/dist/services/knowledge.service');
const { llmService } = require('../backend/dist/services/llm.service');
const { conversationLogService } = require('../backend/dist/services/conversation-log.service');
const { securityHeaders } = require('../backend/dist/middleware/security-headers.middleware');
const { globalLimiter, chatLimiter, emailLimiter, contactLimiter } = require('../backend/dist/middleware/rate-limit.middleware');

const app = express();

// Security headers
app.use(securityHeaders);

// CORS configuration — require explicit FRONTEND_URL in production
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limit
app.use(globalLimiter);

// API Routes (with per-route rate limits where needed)
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/email', emailLimiter, emailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/qualification', qualificationRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);

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
