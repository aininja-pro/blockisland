import { createClient } from '@/lib/supabase/server'

export interface Ad {
  id: string
  title: string
  image_url: string
  destination_url: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  last_served_at: string | null
  created_at: string
  updated_at: string
}

export interface AdStats {
  ad_id: string
  impressions: number
  clicks: number
  ctr: number
}

export interface AdWithStats extends Ad {
  impressions: number
  clicks: number
  ctr: number
}

export async function getAds(): Promise<Ad[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ads:', error)
    throw error
  }

  return data || []
}

export async function getAdStats(): Promise<AdStats[]> {
  const supabase = await createClient()

  // Get impression counts
  const { data: impressionData, error: impError } = await supabase
    .from('ad_events')
    .select('ad_id')
    .eq('event_type', 'impression')

  if (impError) {
    console.error('Error fetching impression stats:', impError)
    throw impError
  }

  // Get click counts
  const { data: clickData, error: clickError } = await supabase
    .from('ad_events')
    .select('ad_id')
    .eq('event_type', 'click')

  if (clickError) {
    console.error('Error fetching click stats:', clickError)
    throw clickError
  }

  // Aggregate by ad_id
  const impressionCounts: Record<string, number> = {}
  for (const row of impressionData || []) {
    impressionCounts[row.ad_id] = (impressionCounts[row.ad_id] || 0) + 1
  }

  const clickCounts: Record<string, number> = {}
  for (const row of clickData || []) {
    clickCounts[row.ad_id] = (clickCounts[row.ad_id] || 0) + 1
  }

  // Combine into stats array
  const allAdIds = new Set([
    ...Object.keys(impressionCounts),
    ...Object.keys(clickCounts),
  ])

  return Array.from(allAdIds).map((adId) => {
    const impressions = impressionCounts[adId] || 0
    const clicks = clickCounts[adId] || 0
    return {
      ad_id: adId,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    }
  })
}

export async function getAdsWithStats(): Promise<AdWithStats[]> {
  const [ads, stats] = await Promise.all([getAds(), getAdStats()])

  const statsMap: Record<string, AdStats> = {}
  for (const stat of stats) {
    statsMap[stat.ad_id] = stat
  }

  return ads.map((ad) => ({
    ...ad,
    impressions: statsMap[ad.id]?.impressions || 0,
    clicks: statsMap[ad.id]?.clicks || 0,
    ctr: statsMap[ad.id]?.ctr || 0,
  }))
}
