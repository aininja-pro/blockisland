'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ListingFormData } from '@/components/listings/listing-form'

export async function createListingAction(data: ListingFormData) {
  const supabase = await createClient()

  // Clean up optional fields
  const cleanedData = {
    name: data.name,
    category: data.category,
    description: data.description || null,
    address: data.address || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    image_url: data.image_url || null,
    is_premium: data.is_premium,
  }

  const { error } = await supabase.from('listings').insert(cleanedData)

  if (error) {
    console.error('Error creating listing:', error)
    return { error: error.message }
  }

  revalidatePath('/listings')
  return { success: true }
}

export async function updateListingAction(id: string, data: ListingFormData) {
  const supabase = await createClient()

  // Clean up optional fields
  const cleanedData = {
    name: data.name,
    category: data.category,
    description: data.description || null,
    address: data.address || null,
    phone: data.phone || null,
    email: data.email || null,
    website: data.website || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    image_url: data.image_url || null,
    is_premium: data.is_premium,
  }

  const { error } = await supabase
    .from('listings')
    .update(cleanedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating listing:', error)
    return { error: error.message }
  }

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
