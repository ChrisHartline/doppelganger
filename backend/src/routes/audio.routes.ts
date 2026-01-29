import { Router, Request, Response } from 'express'
import { elevenLabsService } from '../services/elevenlabs.service'

const router = Router()

// Stream audio for text
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { text } = req.body

    if (!text) {
      res.status(400).json({ error: 'Text is required' })
      return
    }

    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')

    const stream = await elevenLabsService.streamSpeech(text)

    // Pipe the audio stream to the response
    stream.pipe(res)

    stream.on('error', (error) => {
      console.error('Audio stream error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio' })
      }
    })
  } catch (error) {
    console.error('Audio route error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate audio' })
    }
  }
})

// Generate audio (non-streaming, returns buffer)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { text } = req.body

    if (!text) {
      res.status(400).json({ error: 'Text is required' })
      return
    }

    const audioBuffer = await elevenLabsService.generateSpeech(text)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.length)
    res.send(audioBuffer)
  } catch (error) {
    console.error('Audio generate error:', error)
    res.status(500).json({ error: 'Failed to generate audio' })
  }
})

// Check if ElevenLabs is configured
router.get('/status', (_req: Request, res: Response) => {
  const configured = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)
  res.json({
    configured,
    voiceId: configured ? process.env.ELEVENLABS_VOICE_ID : null,
  })
})

export default router
