import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Circle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QualificationProgressProps {
  score: number
  isQualified: boolean
  canBookAppointment: boolean
  onBookAppointment: () => void
}

export function QualificationProgress({
  score,
  isQualified,
  canBookAppointment,
  onBookAppointment,
}: QualificationProgressProps) {
  const qualificationThreshold = 70

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Qualification Status</CardTitle>
        <CardDescription>
          {isQualified
            ? "You're qualified to book an appointment!"
            : "Chat with me to learn more and qualify for an appointment"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(score)}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            {score >= 20 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Introduction completed</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {score >= 40 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Asked about skills/experience</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {score >= 60 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Discussed projects/achievements</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            {score >= qualificationThreshold ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Qualification complete</span>
          </div>
        </div>

        {canBookAppointment && (
          <Button onClick={onBookAppointment} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Book an Appointment
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
