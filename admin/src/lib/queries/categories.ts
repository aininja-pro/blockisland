import { createClient } from '@/lib/supabase/server'

export interface CategoryStats {
  category: string
  totalCount: number
  premiumCount: number
}

// Category from unified categories table (parent_id hierarchy)
export interface Category {
  id: string
  name: string
  parent_id: string | null
  display_order: number
  created_at: string
}

// Category with children for hierarchical display
export interface CategoryWithChildren extends Category {
  children: Category[]
}

export async function getCategoryStats(): Promise<CategoryStats[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listings')
    .select('category, is_premium')

  if (error) {
    console.error('Error fetching category stats:', error)
    throw error
  }

  // Group and count
  const stats: Record<string, { total: number; premium: number }> = {}
  for (const listing of data || []) {
    if (!stats[listing.category]) {
      stats[listing.category] = { total: 0, premium: 0 }
    }
    stats[listing.category].total++
    if (listing.is_premium) {
      stats[listing.category].premium++
    }
  }

  // Convert to array and sort
  return Object.entries(stats)
    .map(([category, counts]) => ({
      category,
      totalCount: counts.total,
      premiumCount: counts.premium,
    }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

// Get all categories (flat list)
export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  return data || []
}

// Get categories as hierarchical tree (sections with children)
export async function getCategoriesHierarchy(): Promise<CategoryWithChildren[]> {
  const allCategories = await getAllCategories()

  // Get sections (parent_id = null)
  const sections = allCategories.filter(c => c.parent_id === null)

  // Attach children to each section
  return sections.map(section => ({
    ...section,
    children: allCategories
      .filter(c => c.parent_id === section.id)
      .sort((a, b) => a.display_order - b.display_order)
  }))
}

// Get category IDs for a listing
export async function getListingCategoryIds(listingId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listing_categories')
    .select('category_id')
    .eq('listing_id', listingId)

  if (error) {
    console.error('Error fetching listing categories:', error)
    throw error
  }

  return (data || []).map(row => row.category_id)
}

// Set categories for a listing (replaces existing)
export async function setListingCategories(listingId: string, categoryIds: string[]): Promise<void> {
  const supabase = await createClient()

  // Delete existing associations
  const { error: deleteError } = await supabase
    .from('listing_categories')
    .delete()
    .eq('listing_id', listingId)

  if (deleteError) {
    console.error('Error deleting listing categories:', deleteError)
    throw deleteError
  }

  // Insert new associations
  if (categoryIds.length > 0) {
    const { error: insertError } = await supabase
      .from('listing_categories')
      .insert(categoryIds.map(categoryId => ({
        listing_id: listingId,
        category_id: categoryId
      })))

    if (insertError) {
      console.error('Error inserting listing categories:', insertError)
      throw insertError
    }
  }
}
