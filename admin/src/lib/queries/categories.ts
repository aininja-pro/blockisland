import { createClient } from '@/lib/supabase/server'

export interface CategoryStats {
  category: string
  totalCount: number
  premiumCount: number
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('category, is_premium')

  if (error) {
    console.error('Error fetching category stats:', error)
    throw error
  }

  // Group and count
  const stats: Record<string, { total: number; premium: number }> = {}
  for (const listing of data || []) {
    if (!stats[listing.category]) {
      stats[listing.category] = { total: 0, premium: 0 }
    }
    stats[listing.category].total++
    if (listing.is_premium) {
      stats[listing.category].premium++
    }
  }

  // Convert to array and sort
  return Object.entries(stats)
    .map(([category, counts]) => ({
      category,
      totalCount: counts.total,
      premiumCount: counts.premium,
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}
