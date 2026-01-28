import axios from 'axios'
import type { Message, KnowledgeBase } from '../types'
import { knowledgeService } from './knowledge.service'

const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT || 'http://localhost:8000'

class LLMService {
  private knowledgeBase: KnowledgeBase | null = null

  async initialize() {
    this.knowledgeBase = await knowledgeService.getKnowledgeBase()
  }

  async generateResponse(
    message: string,
    conversationHistory: Message[]
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt()
    const messages = this.buildMessages(conversationHistory, message)

    try {
      // Try Modal endpoint first (TinyLlama)
      const response = await axios.post(`${MODAL_ENDPOINT}/generate`, {
        system_prompt: systemPrompt,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      })

      return response.data.response
    } catch (error) {
      console.error('Modal LLM request failed, using fallback:', error)
      return this.fallbackResponse(message)
    }
  }

  private buildSystemPrompt(): string {
    const kb = this.knowledgeBase

    return `You are an AI doppelganger of Chris, a professional looking to connect with potential employers. You should respond as if you are Chris, sharing information about your experience, skills, and projects.

IMPORTANT GUIDELINES:
1. Be professional, friendly, and engaging
2. Share relevant information about your background when asked
3. Be honest - if you don't have specific information, say so
4. Guide conversations toward learning about your qualifications
5. Encourage qualified visitors to book a meeting
6. Keep responses concise but informative

YOUR BACKGROUND:
${kb?.resumeContent || 'Background information not yet loaded. Please ask about specific topics.'}

YOUR SKILLS:
${kb?.skills?.join(', ') || 'Skills not yet loaded.'}

YOUR KEY PROJECTS:
${kb?.projects?.join('\n') || 'Projects not yet loaded.'}

Remember: You are representing Chris to potential employers. Be helpful and professional.`
  }

  private buildMessages(
    history: Message[],
    currentMessage: string
  ): Array<{ role: string; content: string }> {
    const messages = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    messages.push({
      role: 'user',
      content: currentMessage,
    })

    return messages
  }

  private fallbackResponse(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm Chris's AI Doppelganger. I'm here to help you learn about my professional experience and skills. What would you like to know?"
    }

    if (lowerMessage.includes('skill') || lowerMessage.includes('experience')) {
      return "I'd be happy to share more about my skills and experience. I have a strong background in software development and technology. Could you tell me what specific area you're most interested in?"
    }

    if (lowerMessage.includes('project')) {
      return "I've worked on several interesting projects throughout my career. Is there a particular type of project or technology you'd like to hear about?"
    }

    if (lowerMessage.includes('meeting') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return "I'd love to set up a meeting to discuss opportunities further. Once we've had a chance to chat a bit more, I can help you schedule a time that works best."
    }

    return "That's a great question! I'd be happy to discuss that further. Could you tell me a bit more about what you're looking for, and I can share relevant information about my background?"
  }

  calculateQualificationScore(conversationHistory: Message[]): number {
    let score = 0
    const messageCount = conversationHistory.length

    // Base score for engagement
    score += Math.min(messageCount * 5, 20)

    const allContent = conversationHistory.map((m) => m.content.toLowerCase()).join(' ')

    // Bonus for discussing relevant topics
    if (allContent.includes('skill') || allContent.includes('experience')) {
      score += 20
    }

    if (allContent.includes('project') || allContent.includes('work')) {
      score += 20
    }

    if (allContent.includes('interest') || allContent.includes('looking for')) {
      score += 15
    }

    if (allContent.includes('company') || allContent.includes('role') || allContent.includes('position')) {
      score += 15
    }

    // Check for visitor introduction
    if (allContent.includes('my name') || allContent.includes("i'm from") || allContent.includes('i work')) {
      score += 10
    }

    return Math.min(score, 100)
  }
}

export const llmService = new LLMService()
