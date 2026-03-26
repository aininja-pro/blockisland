'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSection(name: string) {
  const supabase = createAdminClient()

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

export async function deleteSection(id: string) {
  const supabase = createAdminClient()

  // Get all subcategory IDs for this section
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', id)

  const categoryIds = [id, ...(subcategories || []).map(s => s.id)]

  // Remove listing_categories references first
  for (const catId of categoryIds) {
    await supabase
      .from('listing_categories')
      .delete()
      .eq('category_id', catId)
  }

  // Delete subcategories
  const { error: subError } = await supabase
    .from('categories')
    .delete()
    .eq('parent_id', id)

  if (subError) {
    console.error('Error deleting subcategories:', subError)
    throw subError
  }

  // Delete the section itself
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting section:', error)
    throw error
  }

  revalidatePath('/categories')
}

export async function createSubcategory(parentId: string, name: string) {
  const supabase = createAdminClient()

  // Get max display_order within this section
  const { data: existing } = await supabase
    .from('categories')
    .select('display_order')
    .eq('parent_id', parentId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      parent_id: parentId,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subcategory:', error)
    throw error
  }

  revalidatePath('/categories')
  return data
}

export async function renameCategory(id: string, name: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)

  if (error) {
    console.error('Error renaming category:', error)
    throw error
  }

  revalidatePath('/categories')
}

export async function deleteSubcategory(id: string) {
  const supabase = createAdminClient()

  // Remove listing_categories references first
  await supabase
    .from('listing_categories')
    .delete()
    .eq('category_id', id)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting subcategory:', error)
    throw error
  }

  revalidatePath('/categories')
}
