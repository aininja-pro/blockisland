import { createClient } from '@/lib/supabase/server'
import { Listing } from './listings'

export interface DashboardStats {
  totalListings: number
  premiumMembers: number
  categoriesCount: number
  lastRotation: Date | null
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get total listings count
  const { count: totalListings } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  // Get premium members count
  const { count: premiumMembers } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true)

  // Get distinct categories count
  const { data: categories } = await supabase
    .from('listings')
    .select('category')

  const uniqueCategories = new Set(categories?.map(c => c.category) || [])

  // Get last rotation date
  const { data: lastRotationData } = await supabase
    .from('listings')
    .select('last_rotated_at')
    .eq('is_premium', true)
    .not('last_rotated_at', 'is', null)
    .order('last_rotated_at', { ascending: false })
    .limit(1)
    .single()

  return {
    totalListings: totalListings || 0,
    premiumMembers: premiumMembers || 0,
    categoriesCount: uniqueCategories.size,
    lastRotation: lastRotationData?.last_rotated_at
      ? new Date(lastRotationData.last_rotated_at)
      : null,
  }
}

export async function getRecentlyUpdated(limit: number = 5): Promise<Listing[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recently updated:', error)
    throw error
  }

  return data || []
}
