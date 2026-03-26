import { createClient } from '@/lib/supabase/server'
import { Listing } from './listings'

export interface PremiumByCategory {
  category: string
  listings: Listing[]
}

export async function getPremiumListings(): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_premium', true)
    .order('category')
    .order('rotation_position', { ascending: true })

  if (error) {
    console.error('Error fetching premium listings:', error)
    throw error
  }

  const listings = data || []

  // Resolve category from junction table for listings with empty legacy category
  const needsCategory = listings.filter(l => !l.category)
  if (needsCategory.length > 0) {
    const { data: junctions } = await supabase
      .from('listing_categories')
      .select('listing_id, categories(name, parent_id)')
      .in('listing_id', needsCategory.map(l => l.id))

    if (junctions) {
      const categoryMap: Record<string, string> = {}
      for (const j of junctions) {
        const cat = j.categories as any
        // Prefer section (parent_id = null) over subcategory
        if (cat && cat.parent_id === null) {
          categoryMap[j.listing_id] = cat.name
        } else if (cat && !categoryMap[j.listing_id]) {
          categoryMap[j.listing_id] = cat.name
        }
      }
      for (const listing of listings) {
        if (!listing.category && categoryMap[listing.id]) {
          listing.category = categoryMap[listing.id]
        }
      }
    }
  }

  return listings
}

export async function getPremiumByCategory(): Promise<PremiumByCategory[]> {
  const listings = await getPremiumListings()

  const grouped: Record<string, Listing[]> = {}
  for (const listing of listings) {
    if (!grouped[listing.category]) {
      grouped[listing.category] = []
    }
    grouped[listing.category].push(listing)
  }

  return Object.entries(grouped)
    .map(([category, listings]) => ({
      category,
      listings: listings.sort((a, b) => (a.rotation_position || 0) - (b.rotation_position || 0)),
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

export async function getLastRotationDate(): Promise<Date | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('last_rotated_at')
    .eq('is_premium', true)
    .not('last_rotated_at', 'is', null)
    .order('last_rotated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data?.last_rotated_at) {
    return null
  }

  return new Date(data.last_rotated_at)
}

export async function getNonPremiumByCategory(category: string): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('category', category)
    .eq('is_premium', false)
    .order('name')

  if (error) {
    console.error('Error fetching non-premium listings:', error)
    throw error
  }

  return data || []
}

export async function getMaxRotationPosition(category: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listings')
    .select('rotation_position')
    .eq('category', category)
    .eq('is_premium', true)
    .order('rotation_position', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return 0
  }

  return data.rotation_position || 0
}
