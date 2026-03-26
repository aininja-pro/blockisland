'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload } from 'lucide-react'
import { type Ad, AD_SLOT_LABELS, type AdSlot } from '@/lib/queries/ad-types'

const adSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slot: z.enum(['top_banner', 'middle_block', 'bottom_block']),
  image_url: z.string().url('Must be a valid URL').min(1, 'Image is required'),
  destination_url: z.string().url('Must be a valid URL').min(1, 'Destination URL is required'),
  is_active: z.boolean(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

export type AdFormData = z.infer<typeof adSchema>

interface AdFormProps {
  ad: Ad | null
  onSubmit: (data: AdFormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function AdForm({ ad, onSubmit, onCancel, isLoading }: AdFormProps) {
  const [uploading, setUploading] = useState(false)
  const [runAlways, setRunAlways] = useState(!ad?.start_date && !ad?.end_date)

  const form = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: ad?.title || '',
      slot: ad?.slot || 'middle_block',
      image_url: ad?.image_url || '',
      destination_url: ad?.destination_url || '',
      is_active: ad?.is_active ?? true,
      start_date: ad?.start_date || '',
      end_date: ad?.end_date || '',
    },
  })

  const imageUrl = form.watch('image_url')
  const selectedSlot = form.watch('slot')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.error) {
        throw new Error(data.error)
      }

      form.setValue('image_url', data.url, { shouldValidate: true })
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Ad title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slot</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a slot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(AD_SLOT_LABELS) as [AdSlot, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banner Image</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Image URL" {...field} />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploading}
                      onClick={() => document.getElementById('ad-image-upload')?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      id="ad-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full max-h-40 object-cover rounded border"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedSlot === 'top_banner'
                      ? 'Recommended: 750 × 120 px (wide thin strip)'
                      : 'Recommended: 750 × 360 px (wide rectangle)'}
                  </p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-sm text-muted-foreground">
                {runAlways ? 'Runs indefinitely while active' : 'Runs between specific dates'}
              </p>
            </div>
            <Switch
              checked={runAlways}
              onCheckedChange={(checked) => {
                setRunAlways(checked)
                if (checked) {
                  form.setValue('start_date', '')
                  form.setValue('end_date', '')
                }
              }}
            />
          </div>
          {!runAlways && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <FormLabel className="text-base">Active</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Enable this ad for rotation
                </p>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || uploading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              ad ? 'Update Ad' : 'Create Ad'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
