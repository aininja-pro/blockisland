'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSection(name: string) {
  const supabase = await createClient()

  // Get max display_order
  const { data: existing } = await supabase
    .from('categories')
    .select('display_order')
    .is('parent_id', null)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      parent_id: null,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating section:', error)
    throw error
  }

  revalidatePath('/categories')
  return data
}
