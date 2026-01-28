export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ConversationState {
  messages: Message[]
  isQualified: boolean
  qualificationScore: number
  canBookAppointment: boolean
}

export interface QualificationQuestion {
  id: string
  question: string
  required: boolean
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
}

export interface UserProfile {
  name: string
  title: string
  summary: string
  avatarUrl: string
  skills: string[]
  experience: string[]
}
