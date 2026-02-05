import axios from 'axios'
import type { AppointmentSlot, BookingRequest } from '../types'

const NYLAS_API_URL = 'https://api.us.nylas.com/v3'
const NYLAS_API_KEY = process.env.NYLAS_API_KEY || ''
const NYLAS_GRANT_ID = process.env.NYLAS_GRANT_ID || ''

// Available time blocks: Monday, Thursday, Friday at specific times
const AVAILABLE_DAYS = [1, 4, 5] // Monday, Thursday, Friday
const AVAILABLE_HOURS = {
  start: 14, // 2 PM
  end: 17, // 5 PM
}
const SLOT_DURATION_MINUTES = 30

class NylasService {
  async getAvailableSlots(startDate: Date, endDate: Date): Promise<AppointmentSlot[]> {
    const slots: AppointmentSlot[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()

      // Check if it's an available day
      if (AVAILABLE_DAYS.includes(dayOfWeek)) {
        // Generate slots for the available hours
        for (let hour = AVAILABLE_HOURS.start; hour < AVAILABLE_HOURS.end; hour++) {
          for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
            const slotStart = new Date(current)
            slotStart.setHours(hour, minute, 0, 0)

            const slotEnd = new Date(slotStart)
            slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION_MINUTES)

            // Only include future slots
            if (slotStart > new Date()) {
              const isAvailable = await this.checkSlotAvailability(slotStart, slotEnd)

              slots.push({
                id: `slot-${slotStart.getTime()}`,
                startTime: slotStart,
                endTime: slotEnd,
                available: isAvailable,
              })
            }
          }
        }
      }

      current.setDate(current.getDate() + 1)
    }

    return slots
  }

  private async checkSlotAvailability(start: Date, end: Date): Promise<boolean> {
    if (!NYLAS_API_KEY || !NYLAS_GRANT_ID) {
      // If Nylas not configured, assume available
      return true
    }

    try {
      const response = await axios.get(
        `${NYLAS_API_URL}/grants/${NYLAS_GRANT_ID}/events`,
        {
          headers: {
            Authorization: `Bearer ${NYLAS_API_KEY}`,
          },
          params: {
            calendar_id: 'primary',
            start: Math.floor(start.getTime() / 1000),
            end: Math.floor(end.getTime() / 1000),
          },
        }
      )

      // If no events in this time range, slot is available
      return response.data.data.length === 0
    } catch (error) {
      console.error('Nylas availability check error:', error)
      return true // Default to available if error
    }
  }

  async createEvent(booking: BookingRequest, slot: AppointmentSlot): Promise<{
    success: boolean
    eventId?: string
    confirmationId: string
  }> {
    const confirmationId = `DPLG-${Date.now().toString(36).toUpperCase()}`

    if (!NYLAS_API_KEY || !NYLAS_GRANT_ID) {
      // Mock response if Nylas not configured
      console.log('Nylas not configured, creating mock booking')
      return {
        success: true,
        confirmationId,
      }
    }

    try {
      const response = await axios.post(
        `${NYLAS_API_URL}/grants/${NYLAS_GRANT_ID}/events`,
        {
          title: `Meeting with ${booking.name} (${booking.company})`,
          description: `Purpose: ${booking.purpose}\n\nBooked via AI Doppelganger\nConfirmation ID: ${confirmationId}`,
          when: {
            start_time: Math.floor(new Date(slot.startTime).getTime() / 1000),
            end_time: Math.floor(new Date(slot.endTime).getTime() / 1000),
          },
          participants: [
            {
              email: booking.email,
              name: booking.name,
            },
          ],
          calendar_id: 'primary',
        },
        {
          headers: {
            Authorization: `Bearer ${NYLAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        success: true,
        eventId: response.data.data.id,
        confirmationId,
      }
    } catch (error: any) {
      console.error('Nylas create event error:', error)
      console.error('Nylas error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      })
      throw new Error(`Failed to create calendar event: ${error.response?.data?.message || error.message}`)
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean }> {
    if (!NYLAS_API_KEY || !NYLAS_GRANT_ID) {
      console.log('Nylas not configured, mock email sent to:', to)
      return { success: true }
    }

    try {
      await axios.post(
        `${NYLAS_API_URL}/grants/${NYLAS_GRANT_ID}/messages/send`,
        {
          to: [{ email: to }],
          subject,
          body,
        },
        {
          headers: {
            Authorization: `Bearer ${NYLAS_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return { success: true }
    } catch (error) {
      console.error('Nylas send email error:', error)
      throw new Error('Failed to send email')
    }
  }

  async sendBookingConfirmation(booking: BookingRequest, slot: AppointmentSlot, confirmationId: string): Promise<void> {
    const subject = `Meeting Confirmation - ${confirmationId}`
    const body = `
Hello ${booking.name},

Your meeting has been confirmed!

Details:
- Date: ${new Date(slot.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Time: ${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
- Duration: ${SLOT_DURATION_MINUTES} minutes
- Confirmation ID: ${confirmationId}

Looking forward to speaking with you!

Best regards,
Chris's AI Doppelganger
`

    await this.sendEmail(booking.email, subject, body)
  }
}

export const nylasService = new NylasService()
