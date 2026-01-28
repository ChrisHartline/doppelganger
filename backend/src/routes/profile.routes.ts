import { Router, Request, Response } from 'express'
import { knowledgeService } from '../services/knowledge.service'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const kb = await knowledgeService.getKnowledgeBase()

    res.json({
      name: 'Chris',
      title: 'Software Engineer',
      summary: kb.resumeContent.substring(0, 500) + '...',
      avatarUrl: '/avatar.jpg',
      skills: kb.skills,
      experience: kb.experience,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

router.post('/resume', async (req: Request, res: Response) => {
  try {
    const { content } = req.body

    if (!content) {
      res.status(400).json({ error: 'Resume content is required' })
      return
    }

    await knowledgeService.updateResume(content)

    res.json({ success: true })
  } catch (error) {
    console.error('Update resume error:', error)
    res.status(500).json({ error: 'Failed to update resume' })
  }
})

router.post('/skills', async (req: Request, res: Response) => {
  try {
    const { skills } = req.body

    if (!skills || !Array.isArray(skills)) {
      res.status(400).json({ error: 'Skills array is required' })
      return
    }

    await knowledgeService.updateSkills(skills)

    res.json({ success: true })
  } catch (error) {
    console.error('Update skills error:', error)
    res.status(500).json({ error: 'Failed to update skills' })
  }
})

router.post('/qa', async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body

    if (!question || !answer) {
      res.status(400).json({ error: 'Question and answer are required' })
      return
    }

    await knowledgeService.addQAPair(question, answer)

    res.json({ success: true })
  } catch (error) {
    console.error('Add Q&A error:', error)
    res.status(500).json({ error: 'Failed to add Q&A pair' })
  }
})

export default router
