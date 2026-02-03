import * as fs from 'fs'
import * as path from 'path'
import type { KnowledgeBase } from '../types'

const KNOWLEDGE_DIR = path.join(__dirname, '../../../knowledge')

class KnowledgeService {
  private knowledgeBase: KnowledgeBase | null = null

  async initialize(): Promise<void> {
    await this.loadKnowledgeBase()
  }

  async loadKnowledgeBase(): Promise<void> {
    try {
      // Load resume content
      const resumePath = path.join(KNOWLEDGE_DIR, 'resume.txt')
      const resumeContent = fs.existsSync(resumePath)
        ? fs.readFileSync(resumePath, 'utf-8')
        : ''

      // Load skills
      const skillsPath = path.join(KNOWLEDGE_DIR, 'skills.json')
      const skills = fs.existsSync(skillsPath)
        ? JSON.parse(fs.readFileSync(skillsPath, 'utf-8'))
        : []

      // Load experience
      const experiencePath = path.join(KNOWLEDGE_DIR, 'experience.json')
      const experience = fs.existsSync(experiencePath)
        ? JSON.parse(fs.readFileSync(experiencePath, 'utf-8'))
        : []

      // Load projects
      const projectsPath = path.join(KNOWLEDGE_DIR, 'projects.json')
      const projects = fs.existsSync(projectsPath)
        ? JSON.parse(fs.readFileSync(projectsPath, 'utf-8'))
        : []

      // Load Q&A pairs
      const qaPath = path.join(KNOWLEDGE_DIR, 'qa.json')
      const qa = fs.existsSync(qaPath)
        ? JSON.parse(fs.readFileSync(qaPath, 'utf-8'))
        : []

      this.knowledgeBase = {
        resumeContent,
        skills,
        experience,
        projects,
        qa,
      }

      console.log('Knowledge base loaded successfully')
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
      this.knowledgeBase = {
        resumeContent: '',
        skills: [],
        experience: [],
        projects: [],
        qa: [],
      }
    }
  }

  async getKnowledgeBase(): Promise<KnowledgeBase> {
    if (!this.knowledgeBase) {
      await this.loadKnowledgeBase()
    }
    return this.knowledgeBase!
  }

  async getPersonality(): Promise<any> {
    try {
      const personalityPath = path.join(KNOWLEDGE_DIR, 'personality.json')
      if (fs.existsSync(personalityPath)) {
        return JSON.parse(fs.readFileSync(personalityPath, 'utf-8'))
      }
    } catch (error) {
      console.error('Failed to load personality config:', error)
    }
    return null
  }

  async getHardBoundaries(): Promise<any> {
    try {
      const boundariesPath = path.join(KNOWLEDGE_DIR, 'hard_boundaries.json')
      if (fs.existsSync(boundariesPath)) {
        return JSON.parse(fs.readFileSync(boundariesPath, 'utf-8'))
      }
    } catch (error) {
      console.error('Failed to load hard boundaries:', error)
    }
    return null
  }

  async getContacts(): Promise<Record<string, unknown> | null> {
    try {
      const contactsPath = path.join(KNOWLEDGE_DIR, 'contacts.json')
      if (fs.existsSync(contactsPath)) {
        return JSON.parse(fs.readFileSync(contactsPath, 'utf-8'))
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
    return null
  }

  findContact(name: string, email?: string): Record<string, unknown> | null {
    try {
      const contactsPath = path.join(KNOWLEDGE_DIR, 'contacts.json')
      if (!fs.existsSync(contactsPath)) return null

      const data = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'))
      const contacts = data.contacts || []
      const lowerName = name.toLowerCase()

      for (const contact of contacts) {
        // Check name match
        if (contact.name?.toLowerCase() === lowerName) return contact
        // Check aliases
        if (contact.aliases?.some((a: string) => a.toLowerCase() === lowerName)) return contact
        // Check email
        if (email && contact.email?.toLowerCase() === email.toLowerCase()) return contact
      }
    } catch (error) {
      console.error('Failed to find contact:', error)
    }
    return null
  }

  async updateResume(content: string): Promise<void> {
    const resumePath = path.join(KNOWLEDGE_DIR, 'resume.txt')

    // Ensure directory exists
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })
    }

    fs.writeFileSync(resumePath, content, 'utf-8')
    await this.loadKnowledgeBase()
  }

  async addQAPair(question: string, answer: string): Promise<void> {
    const qaPath = path.join(KNOWLEDGE_DIR, 'qa.json')

    let qa: Array<{ question: string; answer: string }> = []
    if (fs.existsSync(qaPath)) {
      qa = JSON.parse(fs.readFileSync(qaPath, 'utf-8'))
    }

    qa.push({ question, answer })

    // Ensure directory exists
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })
    }

    fs.writeFileSync(qaPath, JSON.stringify(qa, null, 2), 'utf-8')
    await this.loadKnowledgeBase()
  }

  async updateSkills(skills: string[]): Promise<void> {
    const skillsPath = path.join(KNOWLEDGE_DIR, 'skills.json')

    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })
    }

    fs.writeFileSync(skillsPath, JSON.stringify(skills, null, 2), 'utf-8')
    await this.loadKnowledgeBase()
  }

  async updateProjects(projects: string[]): Promise<void> {
    const projectsPath = path.join(KNOWLEDGE_DIR, 'projects.json')

    if (!fs.existsSync(KNOWLEDGE_DIR)) {
      fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })
    }

    fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2), 'utf-8')
    await this.loadKnowledgeBase()
  }
}

export const knowledgeService = new KnowledgeService()
