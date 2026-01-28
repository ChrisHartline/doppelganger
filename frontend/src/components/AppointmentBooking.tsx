import { useState, useEffect } from 'react'
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import type { AppointmentSlot } from '@/types'

interface AppointmentBookingProps {
  onClose: () => void
  onSuccess: (confirmationId: string) => void
}

export function AppointmentBooking({ onClose, onSuccess }: AppointmentBookingProps) {
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    purpose: '',
  })

  useEffect(() => {
    loadSlots()
  }, [])

  const loadSlots = async () => {
    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 14)

      const availableSlots = await api.getAvailableSlots(startDate, endDate)
      setSlots(availableSlots)
    } catch (error) {
      console.error('Failed to load slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setSubmitting(true)
    try {
      const result = await api.bookAppointment({
        ...formData,
        slotId: selectedSlot,
      })
      onSuccess(result.confirmationId)
    } catch (error) {
      console.error('Booking failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatSlotDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatSlotTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const groupedSlots = slots.reduce((acc, slot) => {
    const date = formatSlotDate(slot.startTime)
    if (!acc[date]) acc[date] = []
    acc[date].push(slot)
    return acc
  }, {} as Record<string, AppointmentSlot[]>)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Book an Appointment
        </CardTitle>
        <CardDescription>
          Select a time slot and provide your details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Available Time Slots</Label>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No available slots at this time
              </p>
            ) : (
              <div className="space-y-4 max-h-48 overflow-y-auto">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <p className="text-sm font-medium mb-2">{date}</p>
                    <div className="flex flex-wrap gap-2">
                      {dateSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          type="button"
                          variant={selectedSlot === slot.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSlot(slot.id)}
                          disabled={!slot.available}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatSlotTime(slot.startTime)}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose of Meeting</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Brief description of what you'd like to discuss..."
              required
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!selectedSlot || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Book
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
