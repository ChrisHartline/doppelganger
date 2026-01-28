import { useState, useCallback } from 'react'
import { AvatarDisplay } from '@/components/AvatarDisplay'
import { ChatInterface } from '@/components/ChatInterface'
import { QualificationProgress } from '@/components/QualificationProgress'
import { AppointmentBooking } from '@/components/AppointmentBooking'
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

  const handleSendMessage = useCallback(async (content: string) => {
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

    try {
      const response = await api.sendMessage(content, conversationState.messages)

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

      // Generate video response with D-ID
      setIsSpeaking(true)
      try {
        const videoResponse = await api.generateVideo(response.reply)
        setVideoUrl(videoResponse.videoUrl)
        setIsPlayingVideo(true)
      } catch (videoError) {
        console.error('Video generation failed:', videoError)
      } finally {
        setIsSpeaking(false)
        setIsPlayingVideo(false)
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
    } finally {
      setIsLoading(false)
    }
  }, [conversationState.messages])

  const handleBookAppointment = () => {
    setShowBooking(true)
  }

  const handleBookingSuccess = (confirmationId: string) => {
    setBookingConfirmation(confirmationId)
    setShowBooking(false)
  }

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
                avatarUrl="/avatar.jpg"
                videoUrl={videoUrl || undefined}
                isPlaying={isPlayingVideo}
                isSpeaking={isSpeaking}
                fallbackInitials="CH"
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
