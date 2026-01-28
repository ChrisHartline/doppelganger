import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

import chatRoutes from './routes/chat.routes'
import videoRoutes from './routes/video.routes'
import calendarRoutes from './routes/calendar.routes'
import emailRoutes from './routes/email.routes'
import profileRoutes from './routes/profile.routes'
import qualificationRoutes from './routes/qualification.routes'
import avatarRoutes from './routes/avatar.routes'
import { knowledgeService } from './services/knowledge.service'
import { llmService } from './services/llm.service'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// API Routes
app.use('/api/chat', chatRoutes)
app.use('/api/video', videoRoutes)
app.use('/api/calendar', calendarRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/qualification', qualificationRoutes)
app.use('/api/avatar', avatarRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Initialize services and start server
async function start() {
  try {
    // Initialize knowledge base
    await knowledgeService.initialize()
    await llmService.initialize()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
