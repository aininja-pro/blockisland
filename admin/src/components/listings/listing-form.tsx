'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'

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
      is_premium: listing?.is_premium || false,
    },
  })

  const handleSubmit = async (data: ListingFormData) => {
    await onSubmit(data)
  }

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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appears In *</FormLabel>
              <FormDescription>Select which categories this listing appears in</FormDescription>
              <div className="max-h-72 overflow-y-auto border rounded-lg p-3 space-y-1">
                {categories.map((section) => (
                  <div key={section.id} className="space-y-1">
                    {/* Section (parent category) */}
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
                      />
                      <label
                        htmlFor={section.id}
                        className="text-sm font-semibold cursor-pointer"
                      >
                        {section.name}
                      </label>
                    </div>
                    {/* Subcategories (children) */}
                    {section.children.map((child) => (
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
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Business description..."
                  className="min-h-[100px]"
                  {...field}
                />
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
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
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
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : listing ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
