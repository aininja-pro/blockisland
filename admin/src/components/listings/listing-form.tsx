'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { BlockEditor, ContentBlock, blocksToHtml } from '@/components/editor/block-editor'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MapPin, Phone, Mail, Globe, Eye, Palette, Search, LocateFixed, Loader2 } from 'lucide-react'
import { MapPreview } from '@/components/listings/map-preview'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'

// Parse description field - could be JSON blocks or legacy HTML/text
function parseContentBlocks(description: string | null | undefined): ContentBlock[] {
  if (!description) return []

  // Try to parse as JSON (new format)
  try {
    const parsed = JSON.parse(description)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      return parsed as ContentBlock[]
    }
  } catch {
    // Not JSON, treat as legacy content
  }

  // Legacy content - wrap in a text block
  if (description.trim()) {
    return [{ type: 'text', content: description }]
  }

  return []
}

// Get location thumbnail URL from blocks
function getLocationThumbnail(blocks: ContentBlock[]): string | null {
  for (const block of blocks) {
    if (block.type === 'photo' && block.isLocationThumbnail && block.url) {
      return block.url
    }
  }
  return null
}

const listingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category_ids: z.array(z.string()).min(1, 'Select at least one category'),
  category: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  pin_icon_color: z.string().optional().or(z.literal('')),
  pin_icon_url: z.string().url().optional().or(z.literal('')),
  is_premium: z.boolean(),
})

export type ListingFormData = z.infer<typeof listingSchema>

interface ListingFormProps {
  listing?: Listing | null
  categories: CategoryWithChildren[]
  selectedCategoryIds?: string[]
  onSubmit: (data: ListingFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ListingForm({
  listing,
  categories,
  selectedCategoryIds,
  onSubmit,
  onCancel,
  isLoading,
}: ListingFormProps) {
  // Content blocks state (separate from form for complex editing)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(() =>
    parseContentBlocks(listing?.description)
  )

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: listing?.name || '',
      category_ids: selectedCategoryIds || [],
      category: listing?.category || '',
      description: listing?.description || '',
      address: listing?.address || '',
      phone: listing?.phone || '',
      email: listing?.email || '',
      website: listing?.website || '',
      latitude: listing?.latitude || null,
      longitude: listing?.longitude || null,
      image_url: listing?.image_url || '',
      pin_icon_color: listing?.pin_icon_color || '',
      pin_icon_url: listing?.pin_icon_url || '',
      is_premium: listing?.is_premium || false,
    },
  })

  // Auto-update image_url when a location thumbnail is set
  const handleBlocksChange = useCallback((blocks: ContentBlock[]) => {
    setContentBlocks(blocks)
    const thumbnail = getLocationThumbnail(blocks)
    if (thumbnail) {
      form.setValue('image_url', thumbnail)
    }
  }, [form])

  const handleSubmit = async (data: ListingFormData) => {
    // Serialize content blocks to JSON for storage
    const descriptionJson = JSON.stringify(contentBlocks)
    await onSubmit({ ...data, description: descriptionJson })
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const watchedValues = form.watch()

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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Business name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category_ids"
          render={({ field }) => {
            const query = categorySearch.toLowerCase()
            const filtered = query
              ? categories.filter((section) =>
                  section.name.toLowerCase().includes(query) ||
                  section.children.some((child) => child.name.toLowerCase().includes(query))
                )
              : categories

            return (
              <FormItem>
                <FormLabel>Appears In *</FormLabel>
                <FormDescription>Select which categories this listing appears in</FormDescription>
                <div className="border rounded-lg overflow-hidden">
                  <div className="relative border-b">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="max-h-72 overflow-y-auto p-3 space-y-1">
                    {filtered.map((section) => {
                      const matchingChildren = query
                        ? section.children.filter((child) =>
                            child.name.toLowerCase().includes(query) ||
                            section.name.toLowerCase().includes(query)
                          )
                        : section.children

                      return (
                        <div key={section.id} className="space-y-1">
                          <div className="flex items-center space-x-2 py-1">
                            <Checkbox
                              id={section.id}
                              checked={field.value?.includes(section.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || []
                                if (checked) {
                                  field.onChange([...current, section.id])
                                } else {
                                  field.onChange(current.filter((id: string) => id !== section.id))
                                }
                              }}
                              className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                            />
                            <label
                              htmlFor={section.id}
                              className="text-sm font-semibold cursor-pointer"
                            >
                              {section.name}
                            </label>
                          </div>
                          {matchingChildren.map((child) => (
                            <div key={child.id} className="flex items-center space-x-2 pl-6 py-0.5">
                              <Checkbox
                                id={child.id}
                                checked={field.value?.includes(child.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, child.id])
                                  } else {
                                    field.onChange(current.filter((id: string) => id !== child.id))
                                  }
                                }}
                                className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                              />
                              <label
                                htmlFor={child.id}
                                className="text-sm font-normal cursor-pointer text-muted-foreground"
                              >
                                {child.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    {filtered.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No categories match "{categorySearch}"</p>
                    )}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormItem>
          <FormLabel>Content</FormLabel>
          <FormDescription>
            Add text, photos, videos, quotes, and embeds to build your listing content
          </FormDescription>
          <BlockEditor
            value={contentBlocks}
            onChange={handleBlocksChange}
          />
        </FormItem>

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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 555-5555" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com" {...field} />
              </FormControl>
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

        <MapPreview
          latitude={watchedValues.latitude}
          longitude={watchedValues.longitude}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
          <FormField
            control={form.control}
            name="pin_icon_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Pin Color
                </FormLabel>
                <FormControl>
                  <input
                    type="color"
                    value={field.value || '#e74c3c'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-9 w-14 rounded border cursor-pointer"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pin_icon_color"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="#e74c3c (leave blank for default)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pin_icon_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pin Icon Image URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/pin-icon.png" {...field} />
              </FormControl>
              <FormDescription>Custom pin icon image (overrides pin color)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_premium"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Premium Member</FormLabel>
                <FormDescription>
                  Premium members appear at the top of listings with daily rotation
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
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-1.5" />
            Preview
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : listing ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>

      {/* App Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="bg-slate-800 text-white text-center py-3 px-4">
            <DialogHeader>
              <DialogTitle className="text-white text-sm font-semibold">
                App Preview
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* List item view */}
          <div className="border-b">
            <div className="flex gap-3 p-4">
              {watchedValues.image_url ? (
                <img
                  src={watchedValues.image_url}
                  alt=""
                  className="w-24 h-20 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-20 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-slate-300" />
                </div>
              )}
              <div className="min-w-0 pt-1">
                <p className="font-semibold text-base text-slate-900">
                  {watchedValues.name || 'Business Name'}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {watchedValues.address || 'No address'}
                </p>
              </div>
            </div>
          </div>

          {/* Detail view */}
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {watchedValues.image_url && (
              <img
                src={watchedValues.image_url}
                alt=""
                className="w-full h-44 rounded-lg object-cover"
              />
            )}

            <h3 className="font-bold text-lg text-slate-900">
              {watchedValues.name || 'Business Name'}
            </h3>

            {watchedValues.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600">{watchedValues.address}</p>
              </div>
            )}

            {watchedValues.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-blue-600">{watchedValues.phone}</p>
              </div>
            )}

            {watchedValues.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-blue-600">{watchedValues.email}</p>
              </div>
            )}

            {watchedValues.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-blue-600">{watchedValues.website}</p>
              </div>
            )}

            {contentBlocks.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                {contentBlocks.map((block, i) => {
                  if (block.type === 'text' && block.content) {
                    return (
                      <p key={i} className="text-sm text-slate-600 leading-relaxed">
                        {block.content.replace(/<[^>]*>/g, '')}
                      </p>
                    )
                  }
                  if (block.type === 'photo' && block.url) {
                    return (
                      <div key={i}>
                        <img src={block.url} alt={block.caption || ''} className="w-full rounded-lg object-cover" />
                        {block.caption && <p className="text-xs text-slate-400 mt-1">{block.caption}</p>}
                      </div>
                    )
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote key={i} className="border-l-2 border-slate-300 pl-3 italic text-sm text-slate-500">
                        {block.text}
                        {block.attribution && <cite className="block text-xs mt-1 not-italic">— {block.attribution}</cite>}
                      </blockquote>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  )
}
