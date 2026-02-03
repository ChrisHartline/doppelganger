import { useState, useCallback, useRef } from 'react'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { ChatInterface } from '@/components/ChatInterface'
import { QualificationProgress } from '@/components/QualificationProgress'
import { AppointmentBooking } from '@/components/AppointmentBooking'
import { StatusBar, type ResponseStatus } from '@/components/StatusBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/services/api'
import type { Message, ConversationState } from '@/types'

function App() {
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isQualified: false,
    qualificationScore: 0,
    canBookAppointment: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingConfirmation, setBookingConfirmation] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('idle')
  const [audioEnabled] = useState(true) // Audio enabled by default, can add toggle later
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleSendMessage = useCallback(async (content: string) => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setConversationState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }))

    setIsLoading(true)
    setResponseStatus('thinking')
    setVideoUrl(null) // Clear previous video

    try {
      // Step 1: Get text response (fast)
      const response = await api.sendMessage(content, conversationState.messages)
      setResponseStatus('responding')

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      }

      setConversationState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isQualified: response.isQualified,
        qualificationScore: response.qualificationScore,
        canBookAppointment: response.isQualified,
      }))

      setIsLoading(false)

      // Step 2: Stream audio (fast, ~500ms-1s with streaming)
      if (audioEnabled) {
        setResponseStatus('speaking')
        setIsSpeaking(true)
        try {
          const audio = await api.streamAudio(response.reply)
          currentAudioRef.current = audio

          audio.onended = () => {
            setIsSpeaking(false)
            currentAudioRef.current = null
            // If video is ready, show video_ready status, otherwise complete
            setResponseStatus((prev) => prev === 'video_ready' ? 'video_ready' : 'complete')
          }

          audio.onerror = () => {
            console.error('Audio playback failed')
            setIsSpeaking(false)
            currentAudioRef.current = null
            setResponseStatus('complete')
          }

          await audio.play()
        } catch (audioError) {
          console.error('Audio streaming failed:', audioError)
          setIsSpeaking(false)
          setResponseStatus('complete')
        }
      }

      // Step 3: Generate video in background (slow, 5-30s)
      // This runs concurrently with audio playback
      try {
        setResponseStatus((prev) => prev === 'speaking' ? prev : 'video_generating')
        const videoResponse = await api.generateVideo(response.reply)
        setVideoUrl(videoResponse.videoUrl)
        // Only update status if not still speaking
        setResponseStatus((prev) => {
          if (prev === 'speaking') return 'speaking' // Let audio completion handle it
          return 'video_ready'
        })
      } catch (videoError) {
        console.error('Video generation failed:', videoError)
        // Video is optional, don't fail the whole flow
        // Only mark complete if not still speaking
        setResponseStatus((prev) => prev === 'speaking' ? prev : 'complete')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setConversationState((prev) => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }))
      setResponseStatus('idle')
    } finally {
      setIsLoading(false)
    }
  }, [conversationState.messages, audioEnabled])

  const handleBookAppointment = () => {
    setShowBooking(true)
  }

  const handleBookingSuccess = (confirmationId: string) => {
    setBookingConfirmation(confirmationId)
    setShowBooking(false)
  }

  const handlePlayVideo = useCallback(() => {
    if (videoUrl) {
      // Stop audio if playing
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
        setIsSpeaking(false)
      }
      setIsPlayingVideo(true)
      setResponseStatus('complete')
    }
  }, [videoUrl])

  const handleVideoEnded = useCallback(() => {
    setIsPlayingVideo(false)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Chris's AI Doppelganger</h1>
          <p className="text-muted-foreground mt-2">
            Your digital gateway to learning about my professional experience
          </p>
        </header>

        {bookingConfirmation ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center text-green-600">Booking Confirmed!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Your appointment has been scheduled. You'll receive a confirmation email shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Confirmation ID: {bookingConfirmation}
              </p>
            </CardContent>
          </Card>
        ) : showBooking ? (
          <AppointmentBooking
            onClose={() => setShowBooking(false)}
            onSuccess={handleBookingSuccess}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <div className="lg:col-span-1 flex flex-col items-center space-y-4">
              <AvatarDisplay
                avatarUrl="/avatar.png"
                videoUrl={videoUrl || undefined}
                isPlaying={isPlayingVideo}
                isSpeaking={isSpeaking}
                fallbackInitials="CH"
                onVideoEnded={handleVideoEnded}
              />
              <StatusBar
                status={responseStatus}
                onPlayVideo={handlePlayVideo}
                className="w-full"
              />
              <QualificationProgress
                score={conversationState.qualificationScore}
                isQualified={conversationState.isQualified}
                canBookAppointment={conversationState.canBookAppointment}
                onBookAppointment={handleBookAppointment}
              />
            </div>

            {/* Chat Section */}
            <Card className="lg:col-span-2 h-[600px]">
              <ChatInterface
                messages={conversationState.messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
