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

  // Admin list only needs recent + upcoming events. Exclude events that both
  // started and ended more than ~90 days ago — they stay in the DB and the
  // public feed, just not in this list (keeps the page fast vs. ~3.5k rows).
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffStr = cutoff.toISOString().split('T')[0] // YYYY-MM-DD

  // Fetch in pages of 1000 (Supabase default limit) — the window is normally
  // well under 1000 rows, so this is a single round-trip.
  let allData: Event[] = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`start_date.gte.${cutoffStr},end_date.gte.${cutoffStr}`)
      .order('start_date', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Error fetching events:', error)
      throw error
    }

    allData = allData.concat(data || [])
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  return allData
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
