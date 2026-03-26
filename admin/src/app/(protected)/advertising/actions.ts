'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface AdFormData {
  title: string
  slot: string
  image_url: string
  destination_url: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export async function createAdAction(data: AdFormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ads')
    .insert({
      title: data.title,
      slot: data.slot,
      image_url: data.image_url,
      destination_url: data.destination_url,
      is_active: data.is_active,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
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

  const { error } = await supabase
    .from('ads')
    .update({
      title: data.title,
      slot: data.slot,
      image_url: data.image_url,
      destination_url: data.destination_url,
      is_active: data.is_active,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
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
  })

  if (error) {
    console.error('Error duplicating ad:', error)
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
