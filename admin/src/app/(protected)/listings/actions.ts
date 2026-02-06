'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ListingFormData } from '@/components/listings/listing-form'
import { setListingCategories } from '@/lib/queries/categories'

export async function createListingAction(data: ListingFormData) {
  const supabase = await createClient()

  // Extract category_ids before creating listing
  const { category_ids, ...listingFields } = data

  // Clean up optional fields
  const cleanedData = {
    name: listingFields.name,
    category: listingFields.category || null,
    description: listingFields.description || null,
    address: listingFields.address || null,
    phone: listingFields.phone || null,
    email: listingFields.email || null,
    website: listingFields.website || null,
    latitude: listingFields.latitude || null,
    longitude: listingFields.longitude || null,
    image_url: listingFields.image_url || null,
    pin_icon_color: listingFields.pin_icon_color || null,
    pin_icon_url: listingFields.pin_icon_url || null,
    is_premium: listingFields.is_premium,
  }

  const { data: listing, error } = await supabase
    .from('listings')
    .insert(cleanedData)
    .select('id')
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    return { error: error.message }
  }

  // Set category assignments
  if (category_ids && category_ids.length > 0) {
    await setListingCategories(listing.id, category_ids)
  }

  revalidatePath('/listings')
  return { success: true }
}

export async function updateListingAction(id: string, data: ListingFormData) {
  const supabase = await createClient()

  // Extract category_ids before updating listing
  const { category_ids, ...listingFields } = data

  // Clean up optional fields
  const cleanedData = {
    name: listingFields.name,
    category: listingFields.category || null,
    description: listingFields.description || null,
    address: listingFields.address || null,
    phone: listingFields.phone || null,
    email: listingFields.email || null,
    website: listingFields.website || null,
    latitude: listingFields.latitude || null,
    longitude: listingFields.longitude || null,
    image_url: listingFields.image_url || null,
    pin_icon_color: listingFields.pin_icon_color || null,
    pin_icon_url: listingFields.pin_icon_url || null,
    is_premium: listingFields.is_premium,
  }

  const { error } = await supabase
    .from('listings')
    .update(cleanedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating listing:', error)
    return { error: error.message }
  }

  // Update category assignments
  await setListingCategories(id, category_ids || [])

  revalidatePath('/listings')
  return { success: true }
}

export async function deleteListingAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('listings').delete().eq('id', id)

  if (error) {
    console.error('Error deleting listing:', error)
    return { error: error.message }
  }

  revalidatePath('/listings')
  return { success: true }
}

export async function deleteListingsAction(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase.from('listings').delete().in('id', ids)

  if (error) {
    console.error('Error deleting listings:', error)
    return { error: error.message }
  }

  revalidatePath('/listings')
  return { success: true }
}
