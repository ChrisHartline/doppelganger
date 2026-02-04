import { Router, Request, Response } from 'express'
import { conversationLogService } from '../services/conversation-log.service'
import * as fs from 'fs'
import * as path from 'path'

const router = Router()

// Capture visitor contact information
router.post('/', (req: Request, res: Response) => {
  try {
    const { sessionId, firstName, lastName, company, email, role } = req.body

    // Validate required fields
    if (!sessionId || !firstName || !lastName || !company || !email) {
      res.status(400).json({ 
        error: 'Missing required fields: sessionId, firstName, lastName, company, email' 
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' })
      return
    }

    // Update visitor info in conversation log
    conversationLogService.updateVisitorInfo(sessionId, {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      company,
      email,
      role: role || undefined,
    })

    // Log to separate contacts file for easy access
    logContactToFile({ sessionId, firstName, lastName, company, email, role })

    res.json({ 
      success: true,
      message: 'Contact information saved successfully' 
    })
  } catch (error) {
    console.error('Failed to save contact info:', error)
    res.status(500).json({ error: 'Failed to save contact information' })
  }
})

// Helper function to log contacts to a JSON file
function logContactToFile(contact: {
  sessionId: string
  firstName: string
  lastName: string
  company: string
  email: string
  role?: string
}) {
  try {
    // Use /tmp in Vercel, local path in development
    const contactsDir = process.env.VERCEL ? '/tmp/contacts' : path.join(__dirname, '../../contacts')
    const contactsFile = path.join(contactsDir, 'contacts.json')

    // Ensure directory exists
    if (!fs.existsSync(contactsDir)) {
      fs.mkdirSync(contactsDir, { recursive: true })
    }

    // Read existing contacts or initialize empty array
    let contacts: any[] = []
    if (fs.existsSync(contactsFile)) {
      const data = fs.readFileSync(contactsFile, 'utf-8')
      contacts = JSON.parse(data)
    }

    // Add new contact with timestamp
    contacts.push({
      ...contact,
      capturedAt: new Date().toISOString(),
    })

    // Write back to file
    fs.writeFileSync(contactsFile, JSON.stringify(contacts, null, 2))
    console.log('Contact logged to file:', contact.email)
  } catch (error) {
    console.error('Failed to log contact to file:', error)
    // Don't throw - contact is already saved in conversation log
  }
}

export default router
