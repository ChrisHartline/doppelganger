import { Router, Request, Response } from 'express'
import { didService } from '../services/did.service'
import type { VideoGenerateRequest } from '../types'

const router = Router()

router.post('/generate', async (req: Request<{}, {}, VideoGenerateRequest>, res: Response) => {
  try {
    const { text } = req.body

    if (!text) {
      res.status(400).json({ error: 'Text is required' })
      return
    }

    const result = await didService.generateVideo(text)

    res.json(result)
  } catch (error) {
    console.error('Video generation error:', error)
    res.status(500).json({ error: 'Failed to generate video' })
  }
})

router.get('/status/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const status = await didService.getTalkStatus(id)

    res.json(status)
  } catch (error) {
    console.error('Video status error:', error)
    res.status(500).json({ error: 'Failed to get video status' })
  }
})

export default router
