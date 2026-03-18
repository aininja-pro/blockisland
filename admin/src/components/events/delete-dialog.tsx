'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Event } from '@/lib/queries/events'
import { deleteEventAction, deleteEventsAction } from '@/app/(protected)/events/actions'

interface DeleteDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  event: Event | null
  events: Event[]
}

export function DeleteDialog({
  open,
  onClose,
  event,
  events,
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isBulk = events.length > 0
  const count = isBulk ? events.length : 1
  const name = event?.title || `${count} events`

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      if (isBulk) {
        const ids = events.map((e) => e.id)
        const result = await deleteEventsAction(ids)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success(`${count} events deleted`)
      } else if (event) {
        const result = await deleteEventAction(event.id)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Event deleted')
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
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? `Delete ${count} events?` : 'Delete event?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? (
              <>
                Are you sure you want to delete {count} selected events? This action
                cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{name}</strong>? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
