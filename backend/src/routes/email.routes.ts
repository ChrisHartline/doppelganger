import { Router, Request, Response } from 'express'
import { nylasService } from '../services/nylas.service'

interface SendEmailRequest {
  to: string
  subject: string
  body: string
}

const router = Router()

router.post('/send', async (req: Request<{}, {}, SendEmailRequest>, res: Response) => {
  try {
    const { to, subject, body } = req.body

    if (!to || !subject || !body) {
      res.status(400).json({ error: 'To, subject, and body are required' })
      return
    }

    const result = await nylasService.sendEmail(to, subject, body)

    res.json(result)
  } catch (error) {
    console.error('Send email error:', error)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

export default router
