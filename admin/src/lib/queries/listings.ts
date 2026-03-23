import { createClient } from '@/lib/supabase/server'

export interface Listing {
  id: string
  goodbarber_id: string | null
  name: string
  category: string
  section: string | null
  description: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  website: string | null
  image_url: string | null
  is_premium: boolean
  is_published: boolean
  rotation_position: number | null
  last_rotated_at: string | null
  subscription_date: string | null
  created_at: string
  pin_icon_color: string | null
  pin_icon_url: string | null
  updated_at: string
  subcategory_ids?: string[]  // For form use
}

export interface ListingInsert {
  name: string
  category: string
  section?: string | null
  description?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  email?: string | null
  website?: string | null
  image_url?: string | null
  pin_icon_color?: string | null
  pin_icon_url?: string | null
  is_premium?: boolean
  is_published?: boolean
  subscription_date?: string | null
}

export type ListingUpdate = Partial<ListingInsert>

export async function getListings(): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching listings:', error)
    throw error
  }

  return data || []
}

export async function getListing(id: string): Promise<Listing | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching listing:', error)
    throw error
  }

  return data
}

export async function createListing(data: ListingInsert): Promise<Listing> {
  const supabase = await createClient()
  const { data: listing, error } = await supabase
    .from('listings')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw error
  }

  return listing
}

export async function updateListing(id: string, data: ListingUpdate): Promise<Listing> {
  const supabase = await createClient()
  const { data: listing, error } = await supabase
    .from('listings')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    throw error
  }

  return listing
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
}

export async function deleteListings(ids: string[]): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('listings')
    .delete()
    .in('id', ids)

  if (error) {
    console.error('Error deleting listings:', error)
    throw error
  }
}

export async function togglePublished(id: string, isPublished: boolean): Promise<Listing> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling published status:', error)
    throw error
  }

  return data
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('category')
    .order('category')

  if (error) {
    console.error('Error fetching categories:', error)
    return [] // Non-critical — hierarchical categories are the primary filter
  }

  const uniqueCategories = [...new Set(data?.map(d => d.category) || [])]
  return uniqueCategories
}
