import axios from 'axios'
import * as path from 'path'

const DID_API_URL = 'https://api.d-id.com'
const DID_API_KEY = process.env.DID_API_KEY || ''

interface TalkResponse {
  id: string
  status: string
  result_url?: string
}

class DIDService {
  private sourceUrl: string = ''

  setSourceImage(imageUrl: string) {
    this.sourceUrl = imageUrl
  }

  async createTalkingVideo(
    text: string,
    voiceId?: string
  ): Promise<{ id: string }> {
    if (!DID_API_KEY) {
      throw new Error('D-ID API key not configured')
    }

    try {
      const response = await axios.post<TalkResponse>(
        `${DID_API_URL}/talks`,
        {
          source_url: this.sourceUrl || process.env.AVATAR_URL,
          script: {
            type: 'text',
            input: text,
            provider: {
              type: 'elevenlabs',
              voice_id: voiceId || process.env.ELEVENLABS_VOICE_ID,
            },
          },
          config: {
            fluent: true,
            pad_audio: 0.5,
          },
        },
        {
          headers: {
            Authorization: `Basic ${DID_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return { id: response.data.id }
    } catch (error) {
      console.error('D-ID create talk error:', error)
      throw new Error('Failed to create talking video')
    }
  }

  async getTalkStatus(talkId: string): Promise<{
    status: string
    videoUrl?: string
  }> {
    if (!DID_API_KEY) {
      throw new Error('D-ID API key not configured')
    }

    try {
      const response = await axios.get<TalkResponse>(
        `${DID_API_URL}/talks/${talkId}`,
        {
          headers: {
            Authorization: `Basic ${DID_API_KEY}`,
          },
        }
      )

      return {
        status: response.data.status,
        videoUrl: response.data.result_url,
      }
    } catch (error) {
      console.error('D-ID get talk status error:', error)
      throw new Error('Failed to get talk status')
    }
  }

  async waitForVideo(
    talkId: string,
    maxWaitMs: number = 60000
  ): Promise<string> {
    const startTime = Date.now()
    const pollInterval = 2000

    while (Date.now() - startTime < maxWaitMs) {
      const status = await this.getTalkStatus(talkId)

      if (status.status === 'done' && status.videoUrl) {
        return status.videoUrl
      }

      if (status.status === 'error') {
        throw new Error('Video generation failed')
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new Error('Video generation timed out')
  }

  async generateVideo(text: string): Promise<{
    videoUrl: string
    audioUrl: string
    duration: number
  }> {
    // Create the talking video
    const { id } = await this.createTalkingVideo(text)

    // Wait for completion
    const videoUrl = await this.waitForVideo(id)

    return {
      videoUrl,
      audioUrl: '', // D-ID includes audio in the video
      duration: 0, // Would need to parse video to get actual duration
    }
  }
}

export const didService = new DIDService()
