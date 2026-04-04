'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPublishedListingsBySection } from '@/lib/queries/listings'

interface AdFormData {
  title: string
  slot: string
  image_url: string
  destination_url: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  link_type: string
  linked_listing_id: string | null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function buildInternalUrl(supabase: Awaited<ReturnType<typeof createClient>>, listingId: string): Promise<string | null> {
  // Get the listing name
  const { data: listing } = await supabase
    .from('listings')
    .select('id, name')
    .eq('id', listingId)
    .single()

  if (!listing) return null

  // Get the section's pwa_slug via listing_categories → categories
  const { data: listingCats } = await supabase
    .from('listing_categories')
    .select('category_id, categories(id, parent_id, pwa_slug)')
    .eq('listing_id', listingId)

  if (!listingCats || listingCats.length === 0) return null

  // Find the section (parent_id IS NULL with a pwa_slug), or the parent of a subcategory
  let pwaSlug: string | null = null

  for (const lc of listingCats) {
    const cat = lc.categories as unknown as { id: string; parent_id: string | null; pwa_slug: string | null }
    if (cat.parent_id === null && cat.pwa_slug) {
      // Direct section match
      pwaSlug = cat.pwa_slug
      break
    }
  }

  // If listing is in a subcategory, look up the parent section
  if (!pwaSlug) {
    for (const lc of listingCats) {
      const cat = lc.categories as unknown as { id: string; parent_id: string | null; pwa_slug: string | null }
      if (cat.parent_id) {
        const { data: parentSection } = await supabase
          .from('categories')
          .select('pwa_slug')
          .eq('id', cat.parent_id)
          .single()

        if (parentSection?.pwa_slug) {
          pwaSlug = parentSection.pwa_slug
          break
        }
      }
    }
  }

  if (!pwaSlug) return null

  const listingSlug = slugify(listing.name)
  return `https://m.theblockislandapp.com/${pwaSlug}/i/${listing.id}/${listingSlug}`
}

export async function createAdAction(data: AdFormData) {
  const supabase = await createClient()

  let destinationUrl = data.destination_url
  const linkType = data.link_type || 'external'
  let linkedListingId: string | null = null

  if (linkType === 'internal' && data.linked_listing_id) {
    linkedListingId = data.linked_listing_id
    const builtUrl = await buildInternalUrl(supabase, data.linked_listing_id)
    if (!builtUrl) {
      return { error: 'Could not construct internal URL for the selected listing' }
    }
    destinationUrl = builtUrl
  }

  const { error } = await supabase
    .from('ads')
    .insert({
      title: data.title,
      slot: data.slot,
      image_url: data.image_url,
      destination_url: destinationUrl,
      is_active: data.is_active,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      link_type: linkType,
      linked_listing_id: linkedListingId,
    })

  if (error) {
    console.error('Error creating ad:', error)
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function updateAdAction(id: string, data: AdFormData) {
  const supabase = await createClient()

  let destinationUrl = data.destination_url
  const linkType = data.link_type || 'external'
  let linkedListingId: string | null = null

  if (linkType === 'internal' && data.linked_listing_id) {
    linkedListingId = data.linked_listing_id
    const builtUrl = await buildInternalUrl(supabase, data.linked_listing_id)
    if (!builtUrl) {
      return { error: 'Could not construct internal URL for the selected listing' }
    }
    destinationUrl = builtUrl
  }

  const { error } = await supabase
    .from('ads')
    .update({
      title: data.title,
      slot: data.slot,
      image_url: data.image_url,
      destination_url: destinationUrl,
      is_active: data.is_active,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      link_type: linkType,
      linked_listing_id: linkedListingId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating ad:', error)
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function deleteAdAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('ads').delete().eq('id', id)

  if (error) {
    console.error('Error deleting ad:', error)
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function duplicateAdAction(id: string) {
  const supabase = await createClient()

  const { data: original, error: fetchError } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    console.error('Error fetching ad to duplicate:', fetchError)
    return { error: fetchError?.message || 'Ad not found' }
  }

  const { error } = await supabase.from('ads').insert({
    title: `${original.title} (Copy)`,
    slot: original.slot,
    image_url: original.image_url,
    destination_url: original.destination_url,
    is_active: false,
    start_date: original.start_date,
    end_date: original.end_date,
    link_type: original.link_type,
    linked_listing_id: original.linked_listing_id,
  })

  if (error) {
    console.error('Error duplicating ad:', error)
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function resetAdStatsAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ad_events')
    .delete()
    .eq('ad_id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function deactivateExpiredAdsAction() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  await supabase
    .from('ads')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('is_active', true)
    .not('end_date', 'is', null)
    .lt('end_date', today)
}

export async function toggleAdActiveAction(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ads')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error toggling ad status:', error)
    return { error: error.message }
  }

  revalidatePath('/advertising')
  return { success: true }
}

export async function getListingsBySectionAction(sectionId: string) {
  return getPublishedListingsBySection(sectionId)
}

export async function getListingAnalyticsAction(periodStart: string, periodEnd: string) {
  const { getListingAnalytics } = await import('@/lib/queries/analytics')
  return getListingAnalytics(periodStart, periodEnd)
}

export async function getRotationSettingAction() {
  const { getRotationSetting } = await import('@/lib/queries/analytics')
  return getRotationSetting()
}

export async function updateRotationSettingAction(hours: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('settings')
    .update({ value: String(hours) })
    .eq('key', 'rotation_hours')

  if (error) {
    console.error('Error updating rotation setting:', error)
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
