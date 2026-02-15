'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { setListingCategories } from '@/lib/queries/categories'

export interface BulkListingData {
  name: string
  address: string
  phone: string
  email: string
  website: string
  image_url: string
}

export async function bulkCreateListingsAction(
  listings: BulkListingData[],
  categoryIds: string[]
) {
  const supabase = await createClient()

  let created = 0

  for (const listing of listings) {
    const cleanedData = {
      name: listing.name,
      address: listing.address || null,
      phone: listing.phone || null,
      email: listing.email || null,
      website: listing.website || null,
      image_url: listing.image_url || null,
      category: '',
      is_premium: false,
    }

    const { data, error } = await supabase
      .from('listings')
      .insert(cleanedData)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return { error: `Failed to create "${listing.name}": ${error.message}` }
    }

    if (categoryIds.length > 0) {
      try {
        await setListingCategories(data.id, categoryIds)
      } catch (err) {
        console.error('Error setting categories:', err)
        return { error: `Failed to set categories for "${listing.name}"` }
      }
    }

    created++
  }

  revalidatePath('/listings')
  return { success: true, count: created }
}
