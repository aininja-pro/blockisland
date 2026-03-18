'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EventForm, EventFormData } from './event-form'
import { Event } from '@/lib/queries/events'
import { createEventAction, updateEventAction } from '@/app/(protected)/events/actions'

interface EventDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  event: Event | null
}

export function EventDialog({
  open,
  onClose,
  event,
}: EventDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      if (event) {
        const result = await updateEventAction(event.id, data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Event updated successfully')
      } else {
        const result = await createEventAction(data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Event created successfully')
      }
      onClose(true)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Event' : 'Add New Event'}
          </DialogTitle>
          <DialogDescription>
            {event
              ? 'Make changes to this event.'
              : 'Fill in the details for the new event.'}
          </DialogDescription>
        </DialogHeader>
        <EventForm
          event={event}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
