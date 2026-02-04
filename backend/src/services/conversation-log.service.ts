import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'
import type { Message } from '../types'
import { nylasService } from './nylas.service'

// Use /tmp for serverless (Vercel), local path for development
const LOGS_DIR = process.env.VERCEL ? '/tmp/logs' : path.join(__dirname, '../../logs')
const CONVERSATIONS_FILE = path.join(LOGS_DIR, 'conversations.json')

export interface ConversationLog {
  id: string
  sessionId: string
  startedAt: Date
  lastActivityAt: Date
  messages: Message[]
  visitorInfo: {
    name?: string
    email?: string
    company?: string
    role?: string
    firstName?: string
    lastName?: string
    userAgent?: string
    ip?: string
  }
  hasProvidedContactInfo: boolean
  qualificationScore: number
  isQualified: boolean
  appointmentBooked: boolean
  dealbreakersHit: string[]
  summary?: string
  notificationSent: boolean
}

interface ConversationsStore {
  conversations: ConversationLog[]
}

class ConversationLogService {
  private store: ConversationsStore = { conversations: [] }

  async initialize(): Promise<void> {
    // Ensure logs directory exists
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true })
    }

    // Load existing conversations
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      try {
        const data = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8')
        this.store = JSON.parse(data)
        console.log(`Loaded ${this.store.conversations.length} conversation logs`)
      } catch (error) {
        console.error('Failed to load conversation logs:', error)
        this.store = { conversations: [] }
      }
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(this.store, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save conversation logs:', error)
    }
  }

  createSession(visitorInfo?: Partial<ConversationLog['visitorInfo']>): string {
    const sessionId = randomUUID()
    const conversation: ConversationLog = {
      id: randomUUID(),
      sessionId,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      messages: [],
      visitorInfo: visitorInfo || {},
      hasProvidedContactInfo: false,
      qualificationScore: 0,
      isQualified: false,
      appointmentBooked: false,
      dealbreakersHit: [],
      notificationSent: false,
    }

    this.store.conversations.push(conversation)
    this.save()
    return sessionId
  }

  logMessage(sessionId: string, message: Message): void {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (conversation) {
      conversation.messages.push(message)
      conversation.lastActivityAt = new Date()
      this.save()
    }
  }

  updateQualification(sessionId: string, score: number, isQualified: boolean): void {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (conversation) {
      conversation.qualificationScore = score
      conversation.isQualified = isQualified
      this.save()
    }
  }

  updateVisitorInfo(sessionId: string, info: Partial<ConversationLog['visitorInfo']>): void {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (conversation) {
      conversation.visitorInfo = { ...conversation.visitorInfo, ...info }
      
      // Check if all required contact fields are provided
      const hasRequiredInfo = !!(
        conversation.visitorInfo.firstName &&
        conversation.visitorInfo.lastName &&
        conversation.visitorInfo.company &&
        conversation.visitorInfo.email
      )
      
      if (hasRequiredInfo) {
        conversation.hasProvidedContactInfo = true
      }
      
      this.save()
    }
  }

  getMessageCount(sessionId: string): number {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    return conversation ? conversation.messages.length : 0
  }

  isAtMessageLimit(sessionId: string, limit: number = 10): boolean {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (!conversation) return false
    
    // If they've provided contact info, no limit
    if (conversation.hasProvidedContactInfo) return false
    
    // Count user messages only (not assistant responses)
    const userMessageCount = conversation.messages.filter(m => m.role === 'user').length
    return userMessageCount >= limit
  }

  logDealbreaker(sessionId: string, dealbreaker: string): void {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (conversation && !conversation.dealbreakersHit.includes(dealbreaker)) {
      conversation.dealbreakersHit.push(dealbreaker)
      this.save()
    }
  }

  markAppointmentBooked(sessionId: string): void {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (conversation) {
      conversation.appointmentBooked = true
      this.save()
    }
  }

  getConversation(sessionId: string): ConversationLog | undefined {
    return this.store.conversations.find((c) => c.sessionId === sessionId)
  }

  getAllConversations(): ConversationLog[] {
    return this.store.conversations.sort(
      (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    )
  }

  getRecentConversations(limit: number = 20): ConversationLog[] {
    return this.getAllConversations().slice(0, limit)
  }

  getUnnotifiedConversations(): ConversationLog[] {
    return this.store.conversations.filter(
      (c) => !c.notificationSent && c.messages.length >= 3
    )
  }

  async sendNotification(conversationId: string): Promise<void> {
    const conversation = this.store.conversations.find((c) => c.id === conversationId)
    if (!conversation || conversation.notificationSent) return

    const notifyEmail = process.env.NOTIFICATION_EMAIL
    if (!notifyEmail) {
      console.log('No notification email configured')
      return
    }

    // Build summary
    const messagePreview = conversation.messages
      .slice(0, 5)
      .map((m) => `[${m.role}]: ${m.content.substring(0, 100)}...`)
      .join('\n')

    const subject = conversation.isQualified
      ? `[Doppelganger] Qualified Lead: ${conversation.visitorInfo.name || 'Unknown'}`
      : `[Doppelganger] New Conversation: ${conversation.visitorInfo.name || 'Unknown'}`

    const body = `
New conversation on your AI Doppelganger:

Visitor Info:
- Name: ${conversation.visitorInfo.name || 'Not provided'}
- Email: ${conversation.visitorInfo.email || 'Not provided'}
- Company: ${conversation.visitorInfo.company || 'Not provided'}
- Role: ${conversation.visitorInfo.role || 'Not provided'}

Stats:
- Messages: ${conversation.messages.length}
- Qualification Score: ${conversation.qualificationScore}%
- Qualified: ${conversation.isQualified ? 'Yes' : 'No'}
- Appointment Booked: ${conversation.appointmentBooked ? 'Yes' : 'No'}
- Dealbreakers Hit: ${conversation.dealbreakersHit.join(', ') || 'None'}

Preview:
${messagePreview}

---
View full conversation in your admin panel.
`

    try {
      await nylasService.sendEmail(notifyEmail, subject, body)
      conversation.notificationSent = true
      this.save()
      console.log(`Notification sent for conversation ${conversationId}`)
    } catch (error) {
      console.error('Failed to send notification:', error)
    }
  }

  generateSummary(sessionId: string): string {
    const conversation = this.store.conversations.find((c) => c.sessionId === sessionId)
    if (!conversation) return ''

    const visitorMessages = conversation.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ')

    // Extract key info from messages
    const topics: string[] = []
    if (visitorMessages.includes('skill') || visitorMessages.includes('experience')) {
      topics.push('skills/experience')
    }
    if (visitorMessages.includes('project')) {
      topics.push('projects')
    }
    if (visitorMessages.includes('salary') || visitorMessages.includes('compensation')) {
      topics.push('compensation')
    }
    if (visitorMessages.includes('role') || visitorMessages.includes('position')) {
      topics.push('role details')
    }

    const summary = `${conversation.messages.length} messages, discussed: ${topics.join(', ') || 'general inquiry'}. Score: ${conversation.qualificationScore}%.`

    conversation.summary = summary
    this.save()
    return summary
  }
}

export const conversationLogService = new ConversationLogService()
