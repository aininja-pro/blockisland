'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function togglePremiumAction(listingId: string, isPremium: boolean) {
  const supabase = await createClient()

  if (isPremium) {
    // Setting to premium: get max rotation position for category
    const { data: listing } = await supabase
      .from('listings')
      .select('category')
      .eq('id', listingId)
      .single()

    if (!listing) {
      return { error: 'Listing not found' }
    }

    const { data: maxPosition } = await supabase
      .from('listings')
      .select('rotation_position')
      .eq('category', listing.category)
      .eq('is_premium', true)
      .order('rotation_position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = (maxPosition?.rotation_position || 0) + 1

    const { error } = await supabase
      .from('listings')
      .update({
        is_premium: true,
        rotation_position: newPosition,
      })
      .eq('id', listingId)

    if (error) {
      console.error('Error setting premium:', error)
      return { error: error.message }
    }
  } else {
    // Removing premium: clear rotation data
    const { error } = await supabase
      .from('listings')
      .update({
        is_premium: false,
        rotation_position: 0,
        last_rotated_at: null,
      })
      .eq('id', listingId)

    if (error) {
      console.error('Error removing premium:', error)
      return { error: error.message }
    }
  }

  revalidatePath('/premium')
  revalidatePath('/listings')
  revalidatePath('/dashboard')
  return { success: true }
}
