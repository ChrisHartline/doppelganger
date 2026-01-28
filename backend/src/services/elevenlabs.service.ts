import axios from 'axios'

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || ''

interface Voice {
  voice_id: string
  name: string
}

class ElevenLabsService {
  async listVoices(): Promise<Voice[]> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    try {
      const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      })

      return response.data.voices
    } catch (error) {
      console.error('ElevenLabs list voices error:', error)
      throw new Error('Failed to list voices')
    }
  }

  async generateSpeech(
    text: string,
    voiceId?: string
  ): Promise<Buffer> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    const voice = voiceId || DEFAULT_VOICE_ID
    if (!voice) {
      throw new Error('No voice ID configured')
    }

    try {
      const response = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${voice}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        }
      )

      return Buffer.from(response.data)
    } catch (error) {
      console.error('ElevenLabs generate speech error:', error)
      throw new Error('Failed to generate speech')
    }
  }

  async streamSpeech(
    text: string,
    voiceId?: string
  ): Promise<NodeJS.ReadableStream> {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured')
    }

    const voice = voiceId || DEFAULT_VOICE_ID
    if (!voice) {
      throw new Error('No voice ID configured')
    }

    try {
      const response = await axios.post(
        `${ELEVENLABS_API_URL}/text-to-speech/${voice}/stream`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg',
          },
          responseType: 'stream',
        }
      )

      return response.data
    } catch (error) {
      console.error('ElevenLabs stream speech error:', error)
      throw new Error('Failed to stream speech')
    }
  }
}

export const elevenLabsService = new ElevenLabsService()
