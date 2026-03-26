'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EventDataTable } from '@/components/events/data-table'
import { getColumns } from '@/components/events/columns'
import { Event } from '@/lib/queries/events'
import { EventDialog } from '@/components/events/event-dialog'
import { DeleteDialog } from '@/components/events/delete-dialog'
import { toggleEventPublishedAction, cloneEventAction } from '@/app/(protected)/events/actions'

interface EventsClientProps {
  events: Event[]
}

export function EventsClient({ events }: EventsClientProps) {
  const router = useRouter()
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)
  const [bulkDeleteEvents, setBulkDeleteEvents] = useState<Event[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEdit = (event: Event) => {
    setEditEvent(event)
    setDialogOpen(true)
  }

  const handleDelete = (event: Event) => {
    setDeleteEvent(event)
  }

  const handleCreate = () => {
    setEditEvent(null)
    setDialogOpen(true)
  }

  const handleBulkDelete = (events: Event[]) => {
    setBulkDeleteEvents(events)
  }

  const handleClone = async (event: Event) => {
    const result = await cloneEventAction(event.id)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Event duplicated')
      router.refresh()
    }
  }

  const handleTogglePublished = async (eventId: string, isPublished: boolean) => {
    const result = await toggleEventPublishedAction(eventId, isPublished)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success(isPublished ? 'Event published' : 'Event set to draft')
    router.refresh()
  }

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false)
    setEditEvent(null)
    if (refresh) {
      router.refresh()
    }
  }

  const handleDeleteClose = (refresh?: boolean) => {
    setDeleteEvent(null)
    setBulkDeleteEvents([])
    if (refresh) {
      router.refresh()
    }
  }

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onClone: handleClone,
    onTogglePublished: handleTogglePublished,
  })

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <EventDataTable
        columns={columns}
        data={events}
        onBulkDelete={handleBulkDelete}
      />

      <EventDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        event={editEvent}
      />

      <DeleteDialog
        open={!!deleteEvent || bulkDeleteEvents.length > 0}
        onClose={handleDeleteClose}
        event={deleteEvent}
        events={bulkDeleteEvents}
      />
    </>
  )
}
