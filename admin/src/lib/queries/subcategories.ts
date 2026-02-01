import { createClient } from '@/lib/supabase/server'

export interface Subcategory {
  id: string
  section: string
  name: string
  display_order: number
  created_at: string
}

export async function getAllSubcategories(): Promise<Subcategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .order('section')
    .order('display_order')

  if (error) throw error
  return data || []
}

export async function getSections(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subcategories')
    .select('section')

  if (error) throw error
  return [...new Set(data?.map(d => d.section) || [])]
}

export async function getListingSubcategories(listingId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('listing_subcategories')
    .select('subcategory_id')
    .eq('listing_id', listingId)

  if (error) throw error
  return data?.map(d => d.subcategory_id) || []
}

export async function setListingSubcategories(
  listingId: string,
  subcategoryIds: string[]
): Promise<void> {
  const supabase = await createClient()

  // Delete existing
  await supabase
    .from('listing_subcategories')
    .delete()
    .eq('listing_id', listingId)

  // Insert new
  if (subcategoryIds.length > 0) {
    const inserts = subcategoryIds.map(id => ({
      listing_id: listingId,
      subcategory_id: id
    }))
    const { error } = await supabase
      .from('listing_subcategories')
      .insert(inserts)
    if (error) throw error
  }
}
