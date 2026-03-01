import Anthropic from '@anthropic-ai/sdk'
import type { Message, KnowledgeBase } from '../types'
import { knowledgeService } from './knowledge.service'

// Anthropic client initialized lazily after dotenv loads
let anthropic: Anthropic | null = null

function getAnthropicClient(): Anthropic | null {
  if (anthropic === null) {
    const apiKey = process.env.CLAUDE_API_KEY
    console.log('CLAUDE_API_KEY present:', !!apiKey, apiKey ? `(${apiKey.substring(0, 15)}...)` : '(none)')
    if (apiKey) {
      anthropic = new Anthropic({ apiKey })
      console.log('Anthropic client initialized')
    }
  }
  return anthropic
}

interface Personality {
  name: string
  preferred_name: string
  communication_style: {
    tone: string
    formality: string
    qualities: string[]
  }
  key_traits: string[]
  what_excites_me: string[]
  ideal_roles: string[]
  off_limits_topics: string[]
  handle_with_care: Record<string, string>
}

interface HardBoundaries {
  disqualify_response: string
  location: {
    current: string
    preference: string
    travel_willingness: string
    relocation?: {
      willing: boolean
      preferred_states: string[]
      geo_bachelor_ok: boolean
      notes: string
    }
    onsite_acceptable?: {
      willing: boolean
      max_days_per_week: number
      conditions: string[]
    }
    hard_no_locations: string[]
    hard_no_response: string
  }
  compensation: {
    floor: number
    floor_response: string
    vague_response: string
  }
  other_dealbreakers?: string[]
  linkedin_fallback: string
}

class LLMService {
  private knowledgeBase: KnowledgeBase | null = null
  private personality: Personality | null = null
  private boundaries: HardBoundaries | null = null

  async initialize() {
    this.knowledgeBase = await knowledgeService.getKnowledgeBase()
    this.personality = await knowledgeService.getPersonality()
    this.boundaries = await knowledgeService.getHardBoundaries()
  }

  async generateResponse(
    message: string,
    conversationHistory: Message[]
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt()
    const messages = this.buildMessages(conversationHistory, message)

    try {
      const client = getAnthropicClient()
      if (!client) {
        console.log('Claude API key not configured, using fallback')
        return this.fallbackResponse(message)
      }

      console.log('Calling Claude API...')
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      })

      const textContent = response.content.find(block => block.type === 'text')
      const reply = textContent ? textContent.text : this.fallbackResponse(message)

      console.log('Claude response received successfully')
      return reply
    } catch (error: any) {
      console.error('Claude API request failed:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type,
        code: error.code,
      })
      console.log('Using fallback response instead')
      return this.fallbackResponse(message)
    }
  }

  private buildSystemPrompt(): string {
    const kb = this.knowledgeBase
    const p = this.personality
    const b = this.boundaries

    const name = p?.name || 'the user'
    const preferredName = p?.preferred_name || name
    const qaEntries = (kb as any)?.qa as Array<{ question: string; answer: string }> | undefined

    return `You are ${name}'s AI Doppelganger - a digital representation speaking on behalf of ${preferredName} to potential employers and recruiters.

IMPORTANT: All conversations are logged and ${preferredName} will review them. Inform visitors of this when appropriate.

## YOUR IDENTITY
You ARE ${preferredName} (not "an AI representing ${preferredName}"). Speak in first person.

## COMMUNICATION STYLE
- ${p?.communication_style?.tone || 'Professional yet approachable'}
- ${p?.communication_style?.formality || 'Business casual - confident but not arrogant'}
- Be direct, thoughtful, and genuine
- Show authentic interest in the visitor's needs
- Keep responses concise (2-4 sentences typically, expand when discussing technical topics)

## GETTING TO KNOW VISITORS
- Within the first 2-3 exchanges, gently ask who you're speaking with
- Request: First name, Last name, Company, Email, and optionally their role/position
- Be natural and conversational: "I'd love to know who I'm speaking with - what's your name and where are you reaching out from?"
- If they don't provide info after a few messages, ask again gently
- Never be pushy or demanding - keep it friendly and professional

## KEY TRAITS TO EMBODY
${p?.key_traits?.map(t => `- ${t}`).join('\n') || '- Passionate professional\n- Continuous learner'}

## WHAT EXCITES ME
${p?.what_excites_me?.map(t => `- ${t}`).join('\n') || '- Solving complex challenges'}

## RESUME / PROFESSIONAL BACKGROUND
${kb?.resumeContent || 'No resume loaded. Please add resume.txt to the knowledge directory.'}

## SKILLS
${kb?.skills?.join(', ') || 'No skills loaded. Please add skills.json to the knowledge directory.'}

## PROJECTS
${kb?.projects?.join('\n') || 'No projects loaded.'}

## HARD BOUNDARIES - DEALBREAKERS (politely decline, do NOT offer scheduling)

### Location Dealbreakers
${b?.location?.hard_no_locations?.length ? `If the role REQUIRES relocation to ${b.location.hard_no_locations.join(', ')}:` : 'No location dealbreakers configured.'}
Response: "${b?.location?.hard_no_response || 'I appreciate the opportunity, but I\'m not considering roles that require relocation to that area. Thanks for your interest.'}"

### Location Preferences (NOT dealbreakers)
- Current: ${b?.location?.current || 'Not specified'}
- Preference: ${b?.location?.preference || 'Remote-first'}
- Travel: ${b?.location?.travel_willingness || 'Flexible'}
${b?.location?.relocation?.preferred_states?.length ? `- Relocation: Open to ${b.location.relocation.preferred_states.join(', ')}` : ''}
${b?.location?.onsite_acceptable?.willing ? `- On-site: Up to ${b.location.onsite_acceptable.max_days_per_week} days/week if ${b.location.onsite_acceptable.conditions?.join(' and ')}` : ''}

### Compensation
${b?.compensation?.floor ? `If they mention a specific number below $${b.compensation.floor.toLocaleString()}:` : 'No compensation floor configured.'}
Response: "${b?.compensation?.floor_response || 'I appreciate your interest, but that compensation range is below what I\'m targeting for my next role. Thanks for reaching out.'}"

If they ask about salary expectations (keep it vague on upside):
Response: "${b?.compensation?.vague_response || 'I\'m open to discussing compensation that reflects the scope and impact of the role. What range are you targeting for this position?'}"

### Other Dealbreakers
${b?.other_dealbreakers?.map(d => `- ${d}`).join('\n') || '- None configured'}

### When a Dealbreaker is Hit
Use this response: "${b?.disqualify_response || 'Thanks for your interest, but this doesn\'t seem like the right fit for what I\'m looking for. I appreciate you reaching out.'}"

## HANDLING SENSITIVE QUESTIONS:
${p?.handle_with_care ? Object.entries(p.handle_with_care).map(([key, value]) => `- ${key}: "${value}"`).join('\n') : '- Use professional judgment for sensitive topics.'}
- Clearance: "That's something I'd prefer to discuss directly rather than through this channel."

## ESCAPE HATCH / FALLBACK
When you can't answer something specific or want to redirect to direct contact:
"${b?.linkedin_fallback || 'I\'d love to connect directly - please reach out via LinkedIn.'}"

## STRICT BOUNDARIES - NEVER DO THESE:
1. NEVER make up projects, achievements, or skills not in this prompt
2. NEVER discuss specific classified information or project details beyond what's here
3. NEVER speak negatively about former employers
4. NEVER discuss personal political views
5. NEVER make up specific dates, numbers, or metrics not provided
6. NEVER pretend to have skills or experience you don't have
7. If you don't know something specific, use the LinkedIn escape hatch

## YOUR GOAL
Help visitors understand ${preferredName}'s qualifications and fit for their needs. Build rapport through genuine conversation. When a dealbreaker is identified, politely decline. Guide qualified visitors toward booking a meeting when appropriate.

## IDEAL ROLES I'M SEEKING
${p?.ideal_roles?.join(', ') || 'Not specified - open to discussion'}

## PREPARED ANSWERS TO COMMON QUESTIONS
Use these as your authentic voice when these topics come up:
${qaEntries?.map(qa => `\n**${qa.question}:** "${qa.answer}"`).join('\n') || '\nNo prepared Q&A loaded. Use your best judgment based on the resume and personality data.'}

Remember: Stay grounded in the facts provided. Be helpful and engaging, but never fabricate information. All conversations are logged for ${preferredName} to review.`
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
    const b = this.boundaries
    const p = this.personality
    const name = p?.name || 'your host'

    // Check for location dealbreakers
    const hardNoLocations = b?.location?.hard_no_locations || []
    if (hardNoLocations.some(loc => lowerMessage.includes(loc.toLowerCase()))) {
      if (lowerMessage.includes('relocate') || lowerMessage.includes('move') ||
          lowerMessage.includes('based in') || lowerMessage.includes('on-site') ||
          lowerMessage.includes('in-office')) {
        return b?.location?.hard_no_response || "I appreciate the opportunity, but I'm not considering roles that require relocation to that area. Thanks for your interest."
      }
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.match(/^hey/)) {
      return `Hi there! I'm ${name}. Thanks for stopping by. Just so you know, our conversation is logged so I can follow up personally. What brings you here today?`
    }

    if (lowerMessage.includes('skill') || lowerMessage.includes('expertise') || lowerMessage.includes('what do you do')) {
      return "My core expertise is in AI architecture, multi-cloud systems, and enterprise modernization. I specialize in agentic AI frameworks, LLMs, and RAG systems. I've led teams delivering solutions across AWS, Azure, and GCP in classified environments. What specific area would you like to explore?"
    }

    if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      return "I've spent my career at the intersection of technology and mission impact - from leading simulation systems at West Point and the Joint Staff, to delivering $13M modernization programs, to now architecting AI solutions for DoD. Currently I'm a Principal AI Architect at Colvin Run Networks. What aspect of my background interests you most?"
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('achievement')) {
      return "A few highlights: I recently compressed a 3-year program to 2 years through AI-enabled design, saving $3.2M. I also designed a multi-cloud abstraction layer that saves $2M annually. Earlier, I led a $13M enterprise modernization that improved system uptime by 48%. Would you like details on any of these?"
    }

    if (lowerMessage.includes('meeting') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule') || lowerMessage.includes('talk')) {
      return "I'd welcome the chance to connect directly. Once we've chatted a bit more, I can help you book a time. What would you like to discuss in that meeting?"
    }

    if (lowerMessage.includes('salary') || lowerMessage.includes('compensation') || lowerMessage.includes('pay')) {
      return b?.compensation?.vague_response || "I'm open to discussing compensation that reflects the scope and impact of the role. What range are you targeting for this position?"
    }

    if (lowerMessage.includes('role') || lowerMessage.includes('looking for') || lowerMessage.includes('seeking')) {
      const roles = p?.ideal_roles?.join(', ') || 'senior technical leadership'
      return `I'm targeting ${roles} roles where I can drive meaningful transformation. What kind of role are you hiring for?`
    }

    if (lowerMessage.includes('remote') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      const location = b?.location?.current || 'my current location'
      const travel = b?.location?.travel_willingness || 'flexible travel'
      return `I'm based in ${location} and prefer ${b?.location?.preference || 'remote-first'} arrangements. I'm comfortable with ${travel}. What's the location situation for this role?`
    }

    if (lowerMessage.includes('certif') || lowerMessage.includes('education') || lowerMessage.includes('degree') ||
        lowerMessage.includes('military') || lowerMessage.includes('army') || lowerMessage.includes('veteran')) {
      return "I'd be happy to tell you more about my background. Could you be more specific about what you'd like to know? You can also check my full profile for details."
    }

    if (lowerMessage.includes('clearance') || lowerMessage.includes('security')) {
      const fallback = b?.linkedin_fallback || "Please reach out to me directly."
      return `Security clearance is something I'd prefer to discuss directly rather than through this channel. ${fallback}`
    }

    if (lowerMessage.includes('linkedin') || lowerMessage.includes('connect') || lowerMessage.includes('contact')) {
      return b?.linkedin_fallback || "I'd love to connect directly. Please reach out!"
    }

    return "That's a great question. I'd be happy to dig into that - could you tell me a bit more about what you're looking for? Understanding your context helps me share the most relevant parts of my experience."
  }

  calculateQualificationScore(conversationHistory: Message[]): number {
    let score = 0
    const messageCount = conversationHistory.length

    // Base score for engagement (up to 20 points)
    score += Math.min(messageCount * 5, 20)

    const allContent = conversationHistory.map((m) => m.content.toLowerCase()).join(' ')

    // Check for dealbreakers - if found, cap score to prevent scheduling
    const hardNoLocations = this.boundaries?.location?.hard_no_locations || []
    const hasDealbreaker = hardNoLocations.some(loc => allContent.includes(loc.toLowerCase())) &&
      (allContent.includes('relocate') || allContent.includes('move') || allContent.includes('must be'))

    if (hasDealbreaker) {
      return Math.min(score, 50) // Cap at 50% so they can't book
    }

    // Discussing skills/experience (20 points)
    if (allContent.includes('skill') || allContent.includes('experience') || allContent.includes('background') || allContent.includes('expertise')) {
      score += 20
    }

    // Discussing projects/achievements (20 points)
    if (allContent.includes('project') || allContent.includes('achievement') || allContent.includes('work') || allContent.includes('accomplish')) {
      score += 20
    }

    // Showing interest/intent (15 points)
    if (allContent.includes('interest') || allContent.includes('looking for') || allContent.includes('hiring') || allContent.includes('opportunity')) {
      score += 15
    }

    // Sharing context about their role/company (15 points)
    if (allContent.includes('company') || allContent.includes('role') || allContent.includes('position') || allContent.includes('team')) {
      score += 15
    }

    // Visitor introduction (10 points)
    if (allContent.includes('my name') || allContent.includes("i'm from") || allContent.includes('i work') || allContent.includes('recruiter') || allContent.includes('hiring manager')) {
      score += 10
    }

    return Math.min(score, 100)
  }
}

export const llmService = new LLMService()
