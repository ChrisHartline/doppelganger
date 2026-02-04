import { Router, Request, Response } from 'express'
import { llmService } from '../services/llm.service'
import { conversationLogService } from '../services/conversation-log.service'
import type { ChatRequest } from '../types'

const router = Router()

// Start a new conversation session
router.post('/session', (req: Request, res: Response) => {
  const visitorInfo = {
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
  }

  const sessionId = conversationLogService.createSession(visitorInfo)
  res.json({ sessionId })
})

// Send a message
router.post('/', async (req: Request<{}, {}, ChatRequest & { sessionId?: string }>, res: Response) => {
  try {
    const { message, conversationHistory, sessionId } = req.body

    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    // Log the user message
    if (sessionId) {
      conversationLogService.logMessage(sessionId, {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      })

      // Check if at message limit (10 messages without contact info)
      if (conversationLogService.isAtMessageLimit(sessionId, 10)) {
        const limitReply = "I've really enjoyed our conversation! To continue chatting, I'd love to know who I'm speaking with. Could you please share your name, company, and email? Or, if you'd prefer, feel free to connect with me directly on LinkedIn."
        
        conversationLogService.logMessage(sessionId, {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: limitReply,
          timestamp: new Date(),
        })

        res.json({
          reply: limitReply,
          qualificationScore: 0,
          isQualified: false,
          requiresContactInfo: true,
          linkedInUrl: 'https://www.linkedin.com/in/chrishartline',
        })
        return
      }
    }

    // Generate response
    const reply = await llmService.generateResponse(message, conversationHistory || [])

    // Log the assistant response
    if (sessionId) {
      conversationLogService.logMessage(sessionId, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      })
    }

    // Calculate qualification score
    const updatedHistory = [
      ...(conversationHistory || []),
      { id: 'temp', role: 'user' as const, content: message, timestamp: new Date() },
      { id: 'temp2', role: 'assistant' as const, content: reply, timestamp: new Date() },
    ]
    const qualificationScore = llmService.calculateQualificationScore(updatedHistory)
    const isQualified = qualificationScore >= 70

    // Update qualification status in log
    if (sessionId) {
      conversationLogService.updateQualification(sessionId, qualificationScore, isQualified)

      // Check for dealbreakers and log them
      const lowerMessage = message.toLowerCase()
      const dealbreakers = ['california', 'new york', 'washington dc', 'nyc', 'san francisco']
      for (const dealbreaker of dealbreakers) {
        if (lowerMessage.includes(dealbreaker) &&
            (lowerMessage.includes('relocate') || lowerMessage.includes('move') || lowerMessage.includes('on-site'))) {
          conversationLogService.logDealbreaker(sessionId, `Location: ${dealbreaker}`)
        }
      }

      // Try to extract visitor info from messages
      const nameMatch = message.match(/(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
      const companyMatch = message.match(/(?:from|at|with)\s+([A-Z][A-Za-z0-9\s]+?)(?:\s+and|\s+looking|,|\.)/i)
      const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/)

      if (nameMatch || companyMatch || emailMatch) {
        conversationLogService.updateVisitorInfo(sessionId, {
          ...(nameMatch && { name: nameMatch[1] }),
          ...(companyMatch && { company: companyMatch[1].trim() }),
          ...(emailMatch && { email: emailMatch[0] }),
        })
      }

      // Send notification after meaningful conversation (5+ messages)
      const conversation = conversationLogService.getConversation(sessionId)
      if (conversation && conversation.messages.length >= 5 && !conversation.notificationSent) {
        conversationLogService.generateSummary(sessionId)
        // Fire and forget - don't block the response
        conversationLogService.sendNotification(conversation.id).catch(console.error)
      }
    }

    res.json({
      reply,
      isQualified,
      qualificationScore,
      sessionId,
    })
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

// Update visitor info manually (e.g., from a form)
router.post('/session/:sessionId/info', (req: Request, res: Response) => {
  const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId
  const { name, email, company, role } = req.body

  conversationLogService.updateVisitorInfo(sessionId, { name, email, company, role })
  res.json({ success: true })
})

export default router
