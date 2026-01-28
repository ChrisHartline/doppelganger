import { Router, Request, Response } from 'express'
import { llmService } from '../services/llm.service'
import type { Message } from '../types'

interface CheckQualificationRequest {
  conversationHistory: Message[]
}

const router = Router()

router.post('/check', async (req: Request<{}, {}, CheckQualificationRequest>, res: Response) => {
  try {
    const { conversationHistory } = req.body

    if (!conversationHistory) {
      res.status(400).json({ error: 'Conversation history is required' })
      return
    }

    const score = llmService.calculateQualificationScore(conversationHistory)
    const isQualified = score >= 70

    // Determine missing information
    const missingInfo: string[] = []
    const allContent = conversationHistory.map((m) => m.content.toLowerCase()).join(' ')

    if (!allContent.includes('name') && !allContent.includes('company')) {
      missingInfo.push('Your name and company')
    }

    if (!allContent.includes('interest') && !allContent.includes('looking for')) {
      missingInfo.push('What you\'re looking for')
    }

    if (!allContent.includes('role') && !allContent.includes('position')) {
      missingInfo.push('The role or position details')
    }

    res.json({
      isQualified,
      score,
      missingInfo,
    })
  } catch (error) {
    console.error('Check qualification error:', error)
    res.status(500).json({ error: 'Failed to check qualification' })
  }
})

export default router
