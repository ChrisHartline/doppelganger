import type { Message, VideoResponse, AppointmentSlot, BookingRequest, UserProfile } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiService {
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async sendMessage(message: string, conversationHistory: Message[]): Promise<{
    reply: string
    isQualified: boolean
    qualificationScore: number
  }> {
    return this.fetch('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    })
  }

  async generateVideo(text: string): Promise<VideoResponse> {
    return this.fetch('/video/generate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  async getVideoStatus(videoId: string): Promise<{ status: string; videoUrl?: string }> {
    return this.fetch(`/video/status/${videoId}`)
  }

  async getAvailableSlots(startDate: Date, endDate: Date): Promise<AppointmentSlot[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
    return this.fetch(`/calendar/slots?${params}`)
  }

  async bookAppointment(booking: BookingRequest): Promise<{ success: boolean; confirmationId: string }> {
    return this.fetch('/calendar/book', {
      method: 'POST',
      body: JSON.stringify(booking),
    })
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ success: boolean }> {
    return this.fetch('/email/send', {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    })
  }

  async getProfile(): Promise<UserProfile> {
    return this.fetch('/profile')
  }

  async checkQualification(conversationHistory: Message[]): Promise<{
    isQualified: boolean
    score: number
    missingInfo: string[]
  }> {
    return this.fetch('/qualification/check', {
      method: 'POST',
      body: JSON.stringify({ conversationHistory }),
    })
  }
}

export const api = new ApiService()
