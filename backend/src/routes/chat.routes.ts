import { Router, Request, Response } from 'express'
import { llmService } from '../services/llm.service'
import type { ChatRequest } from '../types'

const router = Router()

router.post('/', async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  try {
    const { message, conversationHistory } = req.body

    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    // Generate response
    const reply = await llmService.generateResponse(message, conversationHistory || [])

    // Calculate qualification score
    const updatedHistory = [
      ...(conversationHistory || []),
      { id: 'temp', role: 'user' as const, content: message, timestamp: new Date() },
      { id: 'temp2', role: 'assistant' as const, content: reply, timestamp: new Date() },
    ]
    const qualificationScore = llmService.calculateQualificationScore(updatedHistory)
    const isQualified = qualificationScore >= 70

    res.json({
      reply,
      isQualified,
      qualificationScore,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

export default router
