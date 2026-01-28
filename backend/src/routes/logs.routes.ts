import { Router, Request, Response } from 'express'
import { conversationLogService, ConversationLog } from '../services/conversation-log.service'

const router = Router()

// Get all conversations (most recent first)
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50
  const conversations = conversationLogService.getRecentConversations(limit)

  // Return summary view (without full message history)
  const summaries = conversations.map((c) => ({
    id: c.id,
    sessionId: c.sessionId,
    startedAt: c.startedAt,
    lastActivityAt: c.lastActivityAt,
    visitorInfo: c.visitorInfo,
    messageCount: c.messages.length,
    qualificationScore: c.qualificationScore,
    isQualified: c.isQualified,
    appointmentBooked: c.appointmentBooked,
    dealbreakersHit: c.dealbreakersHit,
    summary: c.summary,
  }))

  res.json(summaries)
})

// Get a specific conversation with full message history
router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params
  const conversation = conversationLogService.getConversation(sessionId)

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  res.json(conversation)
})

// Get statistics
router.get('/stats/overview', (_req: Request, res: Response) => {
  const all = conversationLogService.getAllConversations()

  const stats = {
    totalConversations: all.length,
    qualifiedLeads: all.filter((c) => c.isQualified).length,
    appointmentsBooked: all.filter((c) => c.appointmentBooked).length,
    dealbreakersHit: all.filter((c) => c.dealbreakersHit.length > 0).length,
    averageQualificationScore:
      all.length > 0
        ? Math.round(all.reduce((sum, c) => sum + c.qualificationScore, 0) / all.length)
        : 0,
    averageMessageCount:
      all.length > 0
        ? Math.round(all.reduce((sum, c) => sum + c.messages.length, 0) / all.length)
        : 0,
    recentActivity: all.slice(0, 5).map((c) => ({
      id: c.id,
      lastActivityAt: c.lastActivityAt,
      visitorName: c.visitorInfo.name,
      isQualified: c.isQualified,
    })),
  }

  res.json(stats)
})

// Get unread/unnotified conversations
router.get('/unread', (_req: Request, res: Response) => {
  const unnotified = conversationLogService.getUnnotifiedConversations()
  res.json(unnotified)
})

// Manually trigger notification for a conversation
router.post('/:conversationId/notify', async (req: Request, res: Response) => {
  const { conversationId } = req.params

  try {
    await conversationLogService.sendNotification(conversationId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' })
  }
})

// Export conversations as CSV
router.get('/export/csv', (_req: Request, res: Response) => {
  const all = conversationLogService.getAllConversations()

  const headers = [
    'Session ID',
    'Started At',
    'Visitor Name',
    'Visitor Email',
    'Visitor Company',
    'Message Count',
    'Qualification Score',
    'Qualified',
    'Appointment Booked',
    'Dealbreakers',
  ]

  const rows = all.map((c) => [
    c.sessionId,
    new Date(c.startedAt).toISOString(),
    c.visitorInfo.name || '',
    c.visitorInfo.email || '',
    c.visitorInfo.company || '',
    c.messages.length.toString(),
    c.qualificationScore.toString(),
    c.isQualified ? 'Yes' : 'No',
    c.appointmentBooked ? 'Yes' : 'No',
    c.dealbreakersHit.join('; '),
  ])

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=conversations.csv')
  res.send(csv)
})

export default router
