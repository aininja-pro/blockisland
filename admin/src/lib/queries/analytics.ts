import { createClient } from '@/lib/supabase/server'

export interface ListingAnalytics {
  id: string
  name: string
  is_premium: boolean
  category_name: string | null
  views: number
  cta_clicks: number
}

/**
 * Get listing analytics (views + CTA clicks) for a given time period.
 * Only returns listings that have a category assignment (filters out old orphaned listings).
 * Default sort: premium first, then by category, then by name.
 */
export async function getListingAnalytics(
  periodStart: string,
  periodEnd: string
): Promise<ListingAnalytics[]> {
  const supabase = await createClient()

  // Get published listings that have at least one category assignment
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(`
      id,
      name,
      is_premium,
      listing_categories!inner(
        category_id,
        categories(id, name, parent_id)
      )
    `)
    .eq('is_published', true)

  if (listingsError) {
    console.error('Error fetching listings for analytics:', listingsError)
    throw listingsError
  }

  // Deduplicate — a listing can appear in multiple categories
  // We want one row per listing with its section (parent) name
  const listingMap = new Map<string, {
    id: string
    name: string
    is_premium: boolean
    category_name: string | null
  }>()

  // Also collect parent_ids we need to look up
  const parentIdsToLookup = new Set<string>()
  const listingParentNeeds = new Map<string, string>() // listing_id -> parent category_id

  for (const listing of listings || []) {
    if (listingMap.has(listing.id)) continue

    const cats = listing.listing_categories as unknown as Array<{
      category_id: string
      categories: { id: string; name: string; parent_id: string | null }
    }>

    let categoryName: string | null = null
    let needsParentLookup: string | null = null

    if (cats) {
      for (const lc of cats) {
        if (lc.categories && lc.categories.parent_id === null) {
          // This IS a section (top-level category)
          categoryName = lc.categories.name
          break
        } else if (lc.categories && lc.categories.parent_id) {
          // This is a subcategory — need to look up the parent section name
          needsParentLookup = lc.categories.parent_id
        }
      }
    }

    if (!categoryName && needsParentLookup) {
      parentIdsToLookup.add(needsParentLookup)
      listingParentNeeds.set(listing.id, needsParentLookup)
    }

    listingMap.set(listing.id, {
      id: listing.id,
      name: listing.name,
      is_premium: listing.is_premium,
      category_name: categoryName,
    })
  }

  // Batch-fetch parent section names for listings only in subcategories
  if (parentIdsToLookup.size > 0) {
    const { data: parents } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', Array.from(parentIdsToLookup))

    const parentNames = new Map<string, string>()
    for (const p of parents || []) {
      parentNames.set(p.id, p.name)
    }

    for (const [listingId, parentId] of listingParentNeeds) {
      const entry = listingMap.get(listingId)
      if (entry && !entry.category_name) {
        entry.category_name = parentNames.get(parentId) || null
      }
    }
  }

  // Get event counts for the period
  const { data: events, error: eventsError } = await supabase
    .from('listing_events')
    .select('listing_id, event_type')
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd)

  if (eventsError) {
    console.error('Error fetching listing events:', eventsError)
    throw eventsError
  }

  // Aggregate events by listing_id
  const viewCounts: Record<string, number> = {}
  const clickCounts: Record<string, number> = {}
  for (const event of events || []) {
    if (event.event_type === 'view') {
      viewCounts[event.listing_id] = (viewCounts[event.listing_id] || 0) + 1
    } else if (event.event_type === 'click') {
      clickCounts[event.listing_id] = (clickCounts[event.listing_id] || 0) + 1
    }
  }

  // Build results and sort: premium first, then by category, then by name
  return Array.from(listingMap.values())
    .map((listing) => ({
      ...listing,
      views: viewCounts[listing.id] || 0,
      cta_clicks: clickCounts[listing.id] || 0,
    }))
    .sort((a, b) => {
      // Premium first
      if (a.is_premium && !b.is_premium) return -1
      if (!a.is_premium && b.is_premium) return 1
      // Then by category name
      const catCmp = (a.category_name || '').localeCompare(b.category_name || '')
      if (catCmp !== 0) return catCmp
      // Then by name
      return (a.name || '').localeCompare(b.name || '')
    })
}

/**
 * Get rotation_hours setting value.
 */
export async function getRotationSetting(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'rotation_hours')
    .single()

  if (error || !data) {
    console.error('Error fetching rotation setting:', error)
    return 24 // fallback
  }

  return parseInt(data.value, 10) || 24
}
