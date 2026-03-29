'use client'

import { useState, useEffect } from 'react'
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
import { type SectionWithSlug } from '@/lib/queries/categories'
import { getListingsBySectionAction } from '@/app/(protected)/advertising/actions'

const adSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slot: z.enum(['top_banner', 'middle_block', 'bottom_block']),
  image_url: z.string().url('Must be a valid URL').min(1, 'Image is required'),
  destination_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  link_type: z.enum(['external', 'internal']),
  linked_listing_id: z.string().optional().or(z.literal('')),
  linked_section_id: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.link_type === 'external') {
    return !!data.destination_url && data.destination_url.length > 0
  }
  return true
}, {
  message: 'Destination URL is required for external links',
  path: ['destination_url'],
}).refine((data) => {
  if (data.link_type === 'internal') {
    return !!data.linked_listing_id && data.linked_listing_id.length > 0
  }
  return true
}, {
  message: 'Please select a listing',
  path: ['linked_listing_id'],
})

export type AdFormData = z.infer<typeof adSchema>

interface AdFormProps {
  ad: Ad | null
  defaultSlot?: AdSlot
  sections: SectionWithSlug[]
  onSubmit: (data: AdFormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function AdForm({ ad, defaultSlot, sections, onSubmit, onCancel, isLoading }: AdFormProps) {
  const [uploading, setUploading] = useState(false)
  const [runAlways, setRunAlways] = useState(!ad?.start_date && !ad?.end_date)
  const [sectionListings, setSectionListings] = useState<{ id: string; name: string }[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [listingSearch, setListingSearch] = useState('')

  // Determine initial section ID from the ad's linked listing
  const [initialSectionId, setInitialSectionId] = useState<string>('')

  const form = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: ad?.title || '',
      slot: ad?.slot || defaultSlot || 'middle_block',
      image_url: ad?.image_url || '',
      destination_url: ad?.destination_url || '',
      is_active: ad?.is_active ?? true,
      start_date: ad?.start_date || '',
      end_date: ad?.end_date || '',
      link_type: ad?.link_type || 'external',
      linked_listing_id: ad?.linked_listing_id || '',
      linked_section_id: '',
    },
  })

  const imageUrl = form.watch('image_url')
  const selectedSlot = form.watch('slot')
  const linkType = form.watch('link_type')
  const linkedSectionId = form.watch('linked_section_id')
  const linkedListingId = form.watch('linked_listing_id')

  // When editing an internal ad, resolve the section from the linked listing
  useEffect(() => {
    if (ad?.link_type === 'internal' && ad.linked_listing_id && sections.length > 0 && !initialSectionId) {
      // Fetch all sections to find which one contains this listing
      const findSection = async () => {
        for (const section of sections) {
          const listings = await getListingsBySectionAction(section.id)
          if (listings.some(l => l.id === ad.linked_listing_id)) {
            setInitialSectionId(section.id)
            form.setValue('linked_section_id', section.id)
            setSectionListings(listings)
            break
          }
        }
      }
      findSection()
    }
  }, [ad, sections, initialSectionId, form])

  // Fetch listings when section changes
  useEffect(() => {
    if (!linkedSectionId) {
      setSectionListings([])
      return
    }

    const fetchListings = async () => {
      setLoadingListings(true)
      const listings = await getListingsBySectionAction(linkedSectionId)
      setSectionListings(listings)
      setLoadingListings(false)

      // Clear listing selection if it's not in the new section (unless it's the initial load)
      if (linkedListingId && !listings.some(l => l.id === linkedListingId)) {
        form.setValue('linked_listing_id', '')
      }
    }
    fetchListings()
  }, [linkedSectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build preview URL
  const previewUrl = (() => {
    if (linkType !== 'internal' || !linkedSectionId || !linkedListingId) return null
    const section = sections.find(s => s.id === linkedSectionId)
    const listing = sectionListings.find(l => l.id === linkedListingId)
    if (!section || !listing) return null
    return `https://m.theblockislandapp.com/${section.pwa_slug}/i/${listing.id}/${slugify(listing.name)}`
  })()

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

        {/* Link Type Toggle */}
        <FormField
          control={form.control}
          name="link_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link Type</FormLabel>
              <FormControl>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="external"
                      checked={field.value === 'external'}
                      onChange={() => {
                        field.onChange('external')
                        form.setValue('destination_url', '')
                        form.setValue('linked_listing_id', '')
                        form.setValue('linked_section_id', '')
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm">External URL</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="internal"
                      checked={field.value === 'internal'}
                      onChange={() => {
                        field.onChange('internal')
                        form.setValue('destination_url', '')
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm">Internal Listing</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* External: Destination URL */}
        {linkType === 'external' && (
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
        )}

        {/* Internal: Category + Listing dropdowns */}
        {linkType === 'internal' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="linked_section_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
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
              name="linked_listing_id"
              render={({ field }) => {
                const selectedListing = sectionListings.find(l => l.id === field.value)
                const filteredListings = sectionListings.filter(l =>
                  l.name.toLowerCase().includes(listingSearch.toLowerCase())
                )
                return (
                  <FormItem>
                    <FormLabel>Listing</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {selectedListing ? (
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <span className="text-sm font-medium">{selectedListing.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto px-2 py-1 text-xs"
                              onClick={() => {
                                field.onChange('')
                                setListingSearch('')
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder={
                                loadingListings
                                  ? 'Loading listings...'
                                  : !linkedSectionId
                                    ? 'Select a category first'
                                    : 'Search listings...'
                              }
                              value={listingSearch}
                              onChange={(e) => setListingSearch(e.target.value)}
                              disabled={!linkedSectionId || loadingListings}
                            />
                            {linkedSectionId && !loadingListings && (
                              <div className="max-h-48 overflow-y-auto rounded-md border">
                                {filteredListings.length === 0 ? (
                                  <p className="p-3 text-sm text-muted-foreground text-center">
                                    No listings found
                                  </p>
                                ) : (
                                  filteredListings.map((listing) => (
                                    <label
                                      key={listing.id}
                                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                                    >
                                      <input
                                        type="radio"
                                        name="listing-select"
                                        checked={false}
                                        onChange={() => field.onChange(listing.id)}
                                        className="accent-primary"
                                      />
                                      {listing.name}
                                    </label>
                                  ))
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {previewUrl && (
              <p className="text-xs text-muted-foreground break-all">
                Preview: {previewUrl}
              </p>
            )}
          </div>
        )}

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
