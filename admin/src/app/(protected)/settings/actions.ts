'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getRotationSettingAction(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'rotation_hours')
    .single()

  if (error || !data) {
    console.error('Error fetching rotation setting:', error)
    return 24
  }

  return parseInt(data.value, 10) || 24
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
