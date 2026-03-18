'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EventFormData } from '@/components/events/event-form'

export async function createEventAction(data: EventFormData) {
  const supabase = await createClient()

  const cleanedData = {
    title: data.title,
    description: data.description || null,
    image_url: data.image_url || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    all_day: data.all_day,
    location_name: data.location_name || null,
    address: data.address || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    category: data.category || null,
    is_published: data.is_published,
  }

  const { error } = await supabase
    .from('events')
    .insert(cleanedData)

  if (error) {
    console.error('Error creating event:', error)
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

export async function updateEventAction(id: string, data: EventFormData) {
  const supabase = await createClient()

  const cleanedData = {
    title: data.title,
    description: data.description || null,
    image_url: data.image_url || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    all_day: data.all_day,
    location_name: data.location_name || null,
    address: data.address || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    category: data.category || null,
    is_published: data.is_published,
  }

  const { error } = await supabase
    .from('events')
    .update(cleanedData)
    .eq('id', id)

  if (error) {
    console.error('Error updating event:', error)
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

export async function deleteEventAction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('events').delete().eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

export async function deleteEventsAction(ids: string[]) {
  const supabase = await createClient()

  const { error } = await supabase.from('events').delete().in('id', ids)

  if (error) {
    console.error('Error deleting events:', error)
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}

export async function toggleEventPublishedAction(id: string, isPublished: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('events')
    .update({ is_published: isPublished })
    .eq('id', id)

  if (error) {
    console.error('Error toggling event published status:', error)
    return { error: error.message }
  }

  revalidatePath('/events')
  return { success: true }
}
