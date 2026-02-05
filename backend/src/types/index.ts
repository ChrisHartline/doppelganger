export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  conversationHistory: Message[]
}

export interface ChatResponse {
  reply: string
  isQualified: boolean
  qualificationScore: number
}

export interface VideoGenerateRequest {
  text: string
}

export interface VideoResponse {
  videoUrl: string
  audioUrl: string
  duration: number
}

export interface AppointmentSlot {
  id: string
  startTime: Date
  endTime: Date
  available: boolean
}

export interface BookingRequest {
  name: string
  email: string
  company: string
  purpose: string
  slotId: string
  phone?: string
  meetsLink?: string
}

export interface UserProfile {
  name: string
  title: string
  summary: string
  avatarUrl: string
  skills: string[]
  experience: string[]
}

export interface KnowledgeBase {
  resumeContent: string
  skills: string[]
  experience: string[]
  projects: string[]
  qa: Array<{ question: string; answer: string }>
}
