import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContactInfoFormProps {
  onSubmit: (contactInfo: ContactInfo) => void
  onLinkedInRedirect: () => void
}

export interface ContactInfo {
  firstName: string
  lastName: string
  company: string
  email: string
  role?: string
}

export function ContactInfoForm({ onSubmit, onLinkedInRedirect }: ContactInfoFormProps) {
  const [formData, setFormData] = useState<ContactInfo>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    role: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContactInfo, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ContactInfo, string>> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleLinkedIn = () => {
    onLinkedInRedirect()
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Let's Continue Our Conversation</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          I'd love to keep chatting! To continue, please share a bit about yourself.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="company">Company *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className={errors.company ? 'border-red-500' : ''}
            />
            {errors.company && (
              <p className="text-xs text-red-500 mt-1">{errors.company}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Position/Role (Optional)</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., CTO, VP Engineering"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full">
              Continue Conversation
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleLinkedIn}
            >
              Connect on LinkedIn Instead
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your information will be used to personalize our conversation and send you a meeting confirmation if you book an appointment.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
