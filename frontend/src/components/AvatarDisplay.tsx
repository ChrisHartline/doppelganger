import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AvatarDisplayProps {
  avatarUrl?: string
  videoUrl?: string
  isPlaying: boolean
  isSpeaking: boolean
  fallbackInitials: string
  onVideoEnded?: () => void
}

export function AvatarDisplay({
  avatarUrl,
  videoUrl,
  isPlaying,
  isSpeaking,
  fallbackInitials,
  onVideoEnded,
}: AvatarDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    if (videoUrl && isPlaying && videoRef.current) {
      setShowVideo(true)
      videoRef.current.play()
    }
  }, [videoUrl, isPlaying])

  const handleVideoEnded = () => {
    setShowVideo(false)
    onVideoEnded?.()
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={cn(
          "relative w-64 h-64 rounded-full overflow-hidden border-4 transition-all duration-300",
          isSpeaking ? "border-primary animate-pulse" : "border-border"
        )}
      >
        {showVideo && videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onEnded={handleVideoEnded}
            autoPlay
            playsInline
          />
        ) : (
          <Avatar className="w-full h-full">
            <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
            <AvatarFallback className="text-4xl">{fallbackInitials}</AvatarFallback>
          </Avatar>
        )}

        {isSpeaking && !showVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-8 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center space-x-2">
        {isSpeaking && (
          <span className="text-sm text-muted-foreground">Speaking...</span>
        )}
      </div>
    </div>
  )
}
