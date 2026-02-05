import { Router, Request, Response } from 'express'
import { nylasService } from '../services/nylas.service'
import type { BookingRequest } from '../types'

const router = Router()

router.get('/slots', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query

    const start = startDate ? new Date(startDate as string) : new Date()
    const end = endDate
      ? new Date(endDate as string)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const slots = await nylasService.getAvailableSlots(start, end)

    res.json(slots)
  } catch (error) {
    console.error('Get slots error:', error)
    res.status(500).json({ error: 'Failed to get available slots' })
  }
})

router.post('/book', async (req: Request<{}, {}, BookingRequest>, res: Response) => {
  try {
    const booking = req.body

    if (!booking.name || !booking.email || !booking.slotId) {
      res.status(400).json({ error: 'Name, email, and slot ID are required' })
      return
    }

    if (!booking.phone && !booking.meetsLink) {
      res.status(400).json({ error: 'Either phone number or Google Meets link is required' })
      return
    }

    // Parse slot ID to get the slot time
    const slotTime = parseInt(booking.slotId.replace('slot-', ''), 10)
    const slotStart = new Date(slotTime)
    const slotEnd = new Date(slotTime + 30 * 60 * 1000)

    const slot = {
      id: booking.slotId,
      startTime: slotStart,
      endTime: slotEnd,
      available: true,
    }

    const result = await nylasService.createEvent(booking, slot)

    // Send confirmation email
    try {
      await nylasService.sendBookingConfirmation(booking, slot, result.confirmationId)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    res.json({
      success: result.success,
      confirmationId: result.confirmationId,
    })
  } catch (error) {
    console.error('Booking error:', error)
    res.status(500).json({ error: 'Failed to book appointment' })
  }
})

export default router
