import { cn } from '@/lib/utils'
import { Loader2, MessageSquare, Volume2, Video, Check } from 'lucide-react'

export type ResponseStatus =
  | 'idle'
  | 'thinking'
  | 'responding'
  | 'speaking'
  | 'video_generating'
  | 'video_ready'
  | 'complete'

interface StatusBarProps {
  status: ResponseStatus
  onPlayVideo?: () => void
  className?: string
}

const statusConfig: Record<ResponseStatus, {
  label: string
  icon: React.ReactNode
  color: string
  pulse: boolean
}> = {
  idle: {
    label: 'Ready',
    icon: <Check className="h-4 w-4" />,
    color: 'text-muted-foreground',
    pulse: false,
  },
  thinking: {
    label: 'Thinking...',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'text-yellow-500',
    pulse: true,
  },
  responding: {
    label: 'Responding...',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-blue-500',
    pulse: true,
  },
  speaking: {
    label: 'Speaking...',
    icon: <Volume2 className="h-4 w-4" />,
    color: 'text-green-500',
    pulse: true,
  },
  video_generating: {
    label: 'Generating video...',
    icon: <Video className="h-4 w-4" />,
    color: 'text-purple-500',
    pulse: true,
  },
  video_ready: {
    label: 'Video ready',
    icon: <Video className="h-4 w-4" />,
    color: 'text-purple-500',
    pulse: false,
  },
  complete: {
    label: 'Complete',
    icon: <Check className="h-4 w-4" />,
    color: 'text-green-500',
    pulse: false,
  },
}

export function StatusBar({ status, onPlayVideo, className }: StatusBarProps) {
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 rounded-lg bg-muted/50 border',
        config.pulse && 'animate-pulse',
        className
      )}
    >
      <div className={cn('flex items-center gap-2', config.color)}>
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Progress indicators */}
      <div className="flex items-center gap-1">
        <StatusDot active={status !== 'idle'} completed={['responding', 'speaking', 'video_generating', 'video_ready', 'complete'].includes(status)} />
        <StatusDot active={['responding', 'speaking', 'video_generating', 'video_ready', 'complete'].includes(status)} completed={['speaking', 'video_generating', 'video_ready', 'complete'].includes(status)} />
        <StatusDot active={['speaking', 'video_generating', 'video_ready', 'complete'].includes(status)} completed={['video_ready', 'complete'].includes(status)} />
        <StatusDot active={['video_ready', 'complete'].includes(status)} completed={status === 'complete'} />
      </div>

      {/* Play video button */}
      {status === 'video_ready' && onPlayVideo && (
        <button
          onClick={onPlayVideo}
          className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 transition-colors"
        >
          <Video className="h-3 w-3" />
          Watch
        </button>
      )}
    </div>
  )
}

function StatusDot({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full transition-colors',
        completed ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-muted-foreground/30'
      )}
    />
  )
}
