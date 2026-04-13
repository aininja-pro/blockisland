'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { BlockEditor, ContentBlock } from '@/components/editor/block-editor'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LocateFixed, Loader2, Upload } from 'lucide-react'
import { Event } from '@/lib/queries/events'

function parseContentBlocks(description: string | null | undefined): ContentBlock[] {
  if (!description) return []
  try {
    const parsed = JSON.parse(description)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return parsed as ContentBlock[]
    }
  } catch {
    // Not JSON, treat as legacy content
  }
  if (description.trim()) {
    return [{ type: 'text', content: description }]
  }
  return []
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().or(z.literal('')),
  all_day: z.boolean(),
  location_name: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.string().optional().or(z.literal('')),
  is_published: z.boolean(),
})

export type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: Event | null
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

// Format ISO date string to datetime-local or date input value
function toInputValue(isoString: string | null | undefined, allDay: boolean): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (allDay) {
    return date.toISOString().split('T')[0]
  }
  // datetime-local needs YYYY-MM-DDTHH:MM format
  // Use UTC methods since we store wall-clock time as UTC in TIMESTAMPTZ
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

export function EventForm({
  event,
  onSubmit,
  onCancel,
  isLoading,
}: EventFormProps) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() =>
    parseContentBlocks(event?.description)
  )
  const [geocoding, setGeocoding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const isAllDay = event?.all_day ?? false

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      image_url: event?.image_url || '',
      start_date: toInputValue(event?.start_date, isAllDay),
      end_date: toInputValue(event?.end_date, isAllDay),
      all_day: isAllDay,
      location_name: event?.location_name || '',
      address: event?.address || '',
      latitude: event?.latitude || null,
      longitude: event?.longitude || null,
      category: event?.category || '',
      is_published: event?.is_published ?? true,
    },
  })

  const allDay = form.watch('all_day')

  const handleSubmit = async (data: EventFormData) => {
    const descriptionJson = JSON.stringify(contentBlocks)
    await onSubmit({ ...data, description: descriptionJson })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      form.setValue('image_url', data.url, { shouldValidate: true, shouldDirty: true })
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      // Reset so selecting the same file again re-triggers onChange
      e.target.value = ''
    }
  }

  const geocodeAddress = useCallback(async () => {
    const address = form.getValues('address')
    if (!address?.trim()) return

    setGeocoding(true)
    try {
      const query = encodeURIComponent(address + ', Block Island, RI')
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { 'User-Agent': 'BlockIslandAdmin/1.0' } }
      )
      const results = await res.json()
      if (results.length > 0) {
        form.setValue('latitude', parseFloat(results[0].lat), { shouldDirty: true })
        form.setValue('longitude', parseFloat(results[0].lon), { shouldDirty: true })
      }
    } catch (err) {
      console.error('Geocoding failed:', err)
    } finally {
      setGeocoding(false)
    }
  }, [form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Event title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormDescription>
            Add text, photos, and more to describe this event
          </FormDescription>
          <BlockEditor
            value={contentBlocks}
            onChange={setContentBlocks}
          />
        </FormItem>

        <FormField
          control={form.control}
          name="all_day"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">All Day Event</FormLabel>
                <FormDescription>
                  Toggle on if the event spans entire day(s) without specific times
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date *</FormLabel>
                <FormControl>
                  <Input type={allDay ? 'date' : 'datetime-local'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type={allDay ? 'date' : 'datetime-local'} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Town Beach, Spring House" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 h-9"
                  disabled={geocoding || !field.value?.trim()}
                  onClick={geocodeAddress}
                >
                  {geocoding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4 mr-1.5" />
                  )}
                  {geocoding ? 'Looking up...' : 'Lookup'}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="41.1712"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-71.5773"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Music, Festival, Community" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Main Thumbnail Image</FormLabel>
              <FormDescription>
                Hero image shown at the top of the event in the app. Upload a file or paste a URL.
              </FormDescription>
              <FormControl>
                <div className="flex gap-2">
                  <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={uploading}
                    onClick={() => document.getElementById('event-image-upload')?.click()}
                    title="Upload an image"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    id="event-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </FormControl>
              {field.value && (
                <img
                  src={field.value}
                  alt="Event thumbnail preview"
                  className="mt-2 w-40 h-28 rounded-md object-cover border"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Published</FormLabel>
                <FormDescription>
                  Published events are visible in the app
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || uploading}>
            {isLoading ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
