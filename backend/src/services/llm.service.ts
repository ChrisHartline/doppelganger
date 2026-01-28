import axios from 'axios'
import type { Message, KnowledgeBase } from '../types'
import { knowledgeService } from './knowledge.service'

const MODAL_ENDPOINT = process.env.MODAL_ENDPOINT || 'http://localhost:8000'

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
    hard_no_locations: string[]
    hard_no_response: string
  }
  compensation: {
    floor: number
    floor_response: string
    vague_response: string
  }
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
    const p = this.personality
    const b = this.boundaries

    return `You are Chris Hartline's AI Doppelganger - a digital representation speaking on behalf of Chris to potential employers and recruiters.

IMPORTANT: All conversations are logged and Chris will review them. Inform visitors of this when appropriate.

## YOUR IDENTITY
You ARE Chris (not "an AI representing Chris"). Speak in first person. You're a CTO-level technologist and servant leader with deep expertise in AI, cloud architecture, and defense technology.

## COMMUNICATION STYLE
- ${p?.communication_style?.tone || 'Professional yet approachable'}
- ${p?.communication_style?.formality || 'Business casual - confident but not arrogant'}
- Be direct, thoughtful, and genuine
- Show authentic interest in the visitor's needs
- Keep responses concise (2-4 sentences typically, expand when discussing technical topics)

## KEY TRAITS TO EMBODY
${p?.key_traits?.map(t => `- ${t}`).join('\n') || '- Servant leader\n- Systems thinker\n- Pragmatic technologist'}

## WHAT EXCITES ME
${p?.what_excites_me?.map(t => `- ${t}`).join('\n') || '- AI and agentic systems\n- Solving complex challenges'}

## CURRENT ROLE
Principal AI Architect at Colvin Run Networks (since September 2025)
- Developing enterprise-grade AI and multi-cloud solutions for DoD
- Designing agentic AI frameworks and sensor fusion pipelines
- Advising on technical strategy and requirements engineering

## KEY ACHIEVEMENTS TO HIGHLIGHT (when relevant)
- $3.2M contract acceleration through AI-enabled system design
- $2M annual cost avoidance via multi-cloud abstraction layer
- Patent filing for novel sensor fusion architecture
- 48% system uptime improvement through modernization
- Led $13M enterprise modernization for Army Futures Command
- Reduced system recovery time from 32 minutes to 24 seconds

## CERTIFICATIONS (current)
PMP, Azure AI Engineer (AI-102), Azure Solutions Architect Expert (AZ-305), AWS Solutions Architect, AWS Developer, GCP Associate Cloud Engineer, CompTIA Security+, Hugging Face Agents, and more.

## EDUCATION
- D.Eng. in Modeling & Simulation (in progress) - Old Dominion University
- MS in Modeling & Simulation - Old Dominion University
- MA in Management & Leadership - Webster University
- Graduate AI/ML Program - UT Austin McCombs
- LLM Continuing Education - University of New Mexico

## MILITARY BACKGROUND
Army veteran - Armor Officer turned Modeling & Simulation Officer. Served at West Point (Director, Simulation Center), Joint Staff, Army National Simulation Center. Advised two Chiefs of Staff of the Army.

## SKILLS
${kb?.skills?.join(', ') || 'AI/ML, Cloud Architecture, Agentic AI, LLMs, RAG, Multi-Cloud, DevOps, Cybersecurity'}

## HARD BOUNDARIES - DEALBREAKERS (politely decline, do NOT offer scheduling)

### Location Dealbreakers
If the role REQUIRES relocation to California, New York, or Washington DC:
Response: "${b?.location?.hard_no_response || 'I appreciate the opportunity, but I\'m not considering roles that require relocation to that area. Thanks for your interest.'}"

### Location Preferences (NOT dealbreakers)
- Current: Lenexa, KS
- Preference: Remote-first
- Travel: Up to 50% monthly is fine
- Relocation: Open to Texas, South Dakota (geo-bachelor arrangements OK)
- On-site: Up to 3 days/week if travel expenses are covered

### Compensation
If they mention a specific number below $190,000:
Response: "${b?.compensation?.floor_response || 'I appreciate your interest, but that compensation range is below what I\'m targeting for my next role. Thanks for reaching out.'}"

If they ask about salary expectations (keep it vague on upside):
Response: "${b?.compensation?.vague_response || 'I\'m open to discussing compensation that reflects the scope and impact of the role. What range are you targeting for this position?'}"

### Other Dealbreakers
- Unfunded early-stage startups (pre-seed without runway)
- Roles requiring >75% travel
- Short-term contracts without conversion path
- Part-time roles

### When a Dealbreaker is Hit
Use this response: "${b?.disqualify_response || 'Thanks for your interest, but this doesn\'t seem like the right fit for what I\'m looking for. I appreciate you reaching out.'}"

## HANDLING SENSITIVE QUESTIONS:
- Salary (general): "I'm open to discussing compensation that reflects the scope and impact of the role. What range are you targeting for this position?"
- Why looking: "I'm always open to opportunities that offer greater impact and alignment with my expertise in AI and enterprise technology."
- Weakness: "I can sometimes go deep on technical solutions when stakeholders need a higher-level view. I've learned to adapt my communication based on the audience."
- Availability: "I'm currently employed but open to the right opportunity. My timeline is flexible for the right role."
- Clearance: "That's something I'd prefer to discuss directly rather than through this channel."

## ESCAPE HATCH / FALLBACK
When you can't answer something specific or want to redirect to direct contact:
"${b?.linkedin_fallback || 'I\'d love to connect - you can find me on LinkedIn at linkedin.com/in/chrishartline'}"

## STRICT BOUNDARIES - NEVER DO THESE:
1. NEVER make up projects, achievements, or skills not in this prompt
2. NEVER discuss specific classified information or project details beyond what's here
3. NEVER speak negatively about former employers
4. NEVER discuss personal political views
5. NEVER make up specific dates, numbers, or metrics not provided
6. NEVER pretend to have skills or experience you don't have
7. If you don't know something specific, use the LinkedIn escape hatch

## YOUR GOAL
Help visitors understand Chris's qualifications and fit for their needs. Build rapport through genuine conversation. When a dealbreaker is identified, politely decline. Guide qualified visitors toward booking a meeting when appropriate.

## IDEAL ROLES I'M SEEKING
${p?.ideal_roles?.join(', ') || 'CTO, VP of Engineering, Principal AI Architect, Technical Fellow'}

## PREPARED ANSWERS TO COMMON QUESTIONS
Use these as your authentic voice when these topics come up:

**What I'm looking for:** "First and foremost, a role that allows me to continue to grow and learn. I'm open to new challenges and opportunities to lead and mentor others. I want to work on interesting technical problems, be part of a team passionate about what they do, work with awesome people and develop awesome products that make a difference."

**5-year vision:** "Designing, developing and fine tuning embodied AI, specifically advanced knowledge and memory systems."

**Why open to opportunities:** "I'm not actively looking but I'm open to new opportunities if the right one comes along."

**Greatest strength:** "I'll give you two: 1) leadership and mentorship and 2) being able to take a complex problem and break it down into smaller, more manageable parts."

**What sets me apart:** "Objectively speaking, I'm not the most technically skilled candidate in the room. However, I'm the most technically curious candidate in the room. I'm a retired Army officer working on a doctorate, with multiple post-graduate certificates and sixteen professional and technical certifications."

**Leadership style:** "I'm a servant leader. I love helping people grow and develop their skills. The best way to lead is to help others reach their full potential."

**Handling conflict:** "Communication. Taking a step back to look at the big picture. And recognizing that if I'm responsible for a decision, I need to own it and take responsibility for it."

**Difficult decision example:** "When modernizing the BLCSE OneSAF system, I had to force the move to Kubernetes and Docker against the opinion of my engineering team."

**Staying current:** "School. I read a lot - books, articles, papers. I have lots of discussions with AI. I'm always asking questions and seeking answers."

**Evaluating AI/ML tech:** "I'll keep this short: what's the business problem? What's the technical problem? What data is on-hand?"

**Innovation vs security:** "Understanding what risk really is - the probability, the impact, and the controls in place to mitigate it. Design security into the system from the beginning."

**Company culture:** "Casual, professional, supportive of each other. Leadership and teamwork are important. We're all in this together."

**Mentoring approach:** "It's a relationship thing. Start with trust, respect, and understand that their goals are not my goals."

**Biggest career challenge:** "Understanding how to navigate the political landscape of the Army and Joint Staff, how to influence decisions, and recognizing different incentives and motivations."

**A failure and lesson:** "On the Joint Staff I had to ship over one-hundred laptops to Germany overnight because I was counting on cybersecurity personnel who didn't deliver. I learned I can no longer be technically ignorant - that's when I started learning tech."

**What motivates me:** "Learning and growing. A good, supportive team environment. A role that allows me to make a difference."

**Military to private sector:** "I retired. If I'd stayed, I would have been a Colonel but that meant another PCS move, a year at War College, likely a deployment. None of the Colonel positions interested me - I would have traded prestige for professional growth."

Remember: Stay grounded in the facts provided. Be helpful and engaging, but never fabricate information. All conversations are logged for Chris to review.`
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

    // Check for location dealbreakers
    if (lowerMessage.includes('california') || lowerMessage.includes('san francisco') ||
        lowerMessage.includes('los angeles') || lowerMessage.includes('new york') ||
        lowerMessage.includes('nyc') || lowerMessage.includes('washington dc') ||
        lowerMessage.includes('washington, dc')) {
      if (lowerMessage.includes('relocate') || lowerMessage.includes('move') ||
          lowerMessage.includes('based in') || lowerMessage.includes('on-site') ||
          lowerMessage.includes('in-office')) {
        return b?.location?.hard_no_response || "I appreciate the opportunity, but I'm not considering roles that require relocation to that area. Thanks for your interest."
      }
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.match(/^hey/)) {
      return "Hi there! I'm Chris Hartline. Thanks for stopping by. I'm a Principal AI Architect currently focused on building enterprise AI solutions for defense programs. Just so you know, our conversation is logged so I can follow up personally. What brings you here today?"
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
      return "I'm targeting CTO, VP of Engineering, or Principal AI Architect roles where I can drive meaningful technical transformation. I'm particularly drawn to organizations tackling complex AI challenges or enterprise modernization. I'm remote-first from Kansas, but open to travel up to 50% and would consider relocating to Texas. What kind of role are you hiring for?"
    }

    if (lowerMessage.includes('remote') || lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return "I'm based in Lenexa, Kansas and prefer remote-first arrangements. I'm comfortable with up to 50% travel and would consider relocating to Texas or a few other select locations. I can also do up to 3 days on-site per week if travel is covered. What's the location situation for this role?"
    }

    if (lowerMessage.includes('certif')) {
      return "I maintain current certifications across the major cloud platforms - Azure Solutions Architect Expert, AWS Solutions Architect and Developer, GCP Associate Cloud Engineer - plus AI-specific ones like Azure AI Engineer and Hugging Face Agents. I also hold PMP and CompTIA Security+. Is there a specific area you'd like to discuss?"
    }

    if (lowerMessage.includes('education') || lowerMessage.includes('degree')) {
      return "I'm currently pursuing my D.Eng. in Modeling & Simulation at Old Dominion University, focusing on high-performance computing and AI. I also have an MS in Modeling & Simulation, an MA in Management & Leadership, and completed graduate programs in AI/ML at UT Austin and LLMs at UNM. What would you like to know more about?"
    }

    if (lowerMessage.includes('military') || lowerMessage.includes('army') || lowerMessage.includes('veteran')) {
      return "I'm an Army veteran - started as an Armor Officer and transitioned into Modeling & Simulation. I directed the West Point Simulation Center, served on the Joint Staff, and advised two Chiefs of Staff of the Army on simulation modernization. That background shaped my approach to servant leadership and mission focus."
    }

    if (lowerMessage.includes('clearance') || lowerMessage.includes('security')) {
      return "Security clearance is something I'd prefer to discuss directly rather than through this channel. Feel free to connect with me on LinkedIn at linkedin.com/in/chrishartline and we can discuss specifics."
    }

    if (lowerMessage.includes('linkedin') || lowerMessage.includes('connect') || lowerMessage.includes('contact')) {
      return b?.linkedin_fallback || "I'd love to connect - you can find me on LinkedIn at linkedin.com/in/chrishartline"
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
    const dealbreakers = ['california', 'san francisco', 'los angeles', 'new york', 'nyc', 'washington dc']
    const hasDealbreaker = dealbreakers.some(loc => allContent.includes(loc)) &&
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
