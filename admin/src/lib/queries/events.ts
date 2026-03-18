import { createClient } from '@/lib/supabase/server'

export interface Event {
  id: string
  title: string
  description: string | null
  image_url: string | null
  start_date: string
  end_date: string | null
  all_day: boolean
  location_name: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  category: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface EventInsert {
  title: string
  description?: string | null
  image_url?: string | null
  start_date: string
  end_date?: string | null
  all_day?: boolean
  location_name?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  category?: string | null
  is_published?: boolean
}

export type EventUpdate = Partial<EventInsert>

export async function getEvents(): Promise<Event[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }

  return data || []
}

export async function getEvent(id: string): Promise<Event | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    throw error
  }

  return data
}

export async function toggleEventPublished(id: string, isPublished: boolean): Promise<Event> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .update({ is_published: isPublished })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling event published status:', error)
    throw error
  }

  return data
}
