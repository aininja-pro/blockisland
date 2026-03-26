'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, ImageIcon, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Event } from '@/lib/queries/events'

interface ColumnsProps {
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
  onClone: (event: Event) => void
  onTogglePublished: (eventId: string, isPublished: boolean) => Promise<void>
}

function formatEventDate(startDate: string, endDate: string | null, allDay: boolean): string {
  const start = new Date(startDate)
  const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }

  if (allDay) {
    const startStr = start.toLocaleDateString('en-US', dateOpts)
    if (endDate) {
      const end = new Date(endDate)
      const endStr = end.toLocaleDateString('en-US', dateOpts)
      return startStr === endStr ? startStr : `${startStr} - ${endStr}`
    }
    return startStr
  }

  const startDateStr = start.toLocaleDateString('en-US', dateOpts)
  const startTimeStr = start.toLocaleTimeString('en-US', timeOpts)

  if (endDate) {
    const end = new Date(endDate)
    const endDateStr = end.toLocaleDateString('en-US', dateOpts)
    const endTimeStr = end.toLocaleTimeString('en-US', timeOpts)
    if (startDateStr === endDateStr) {
      return `${startDateStr}, ${startTimeStr} - ${endTimeStr}`
    }
    return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`
  }

  return `${startDateStr}, ${startTimeStr}`
}

export function getColumns({ onEdit, onDelete, onClone, onTogglePublished }: ColumnsProps): ColumnDef<Event>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'event',
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Event
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-16 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{event.title}</div>
              {event.location_name && (
                <div className="text-sm text-muted-foreground truncate">
                  {event.location_name}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: 'date',
      accessorKey: 'start_date',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">
              {formatEventDate(event.start_date, event.end_date, event.all_day)}
            </span>
            {event.all_day && (
              <Badge variant="secondary" className="text-xs">All Day</Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }) => {
        const event = row.original
        const isPublished = event.is_published !== false
        return (
          <button
            onClick={() => onTogglePublished(event.id, !isPublished)}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              isPublished
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
            }`}
          >
            {isPublished ? 'Published' : 'Draft'}
          </button>
        )
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true
        const isPublished = row.getValue(id) !== false
        if (value === 'published') return isPublished
        if (value === 'draft') return !isPublished
        return true
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const event = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(event)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onClone(event)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(event)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
