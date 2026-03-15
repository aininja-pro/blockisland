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

// Section stats from the new categories hierarchy
export interface SectionStats {
  id: string
  name: string
  totalCount: number
  premiumCount: number
  subcategoryCount: number
}

export async function getSectionStats(): Promise<SectionStats[]> {
  const supabase = await createClient()

  // Get sections (parent_id = null)
  const { data: sections, error: sectionsError } = await supabase
    .from('categories')
    .select('id, name')
    .is('parent_id', null)
    .order('display_order')

  if (sectionsError) {
    console.error('Error fetching sections:', sectionsError)
    throw sectionsError
  }

  // Get all subcategory counts per section
  const { data: subcategories, error: subError } = await supabase
    .from('categories')
    .select('parent_id')
    .not('parent_id', 'is', null)

  if (subError) {
    console.error('Error fetching subcategories:', subError)
    throw subError
  }

  // Count subcategories per section
  const subcategoryCounts: Record<string, number> = {}
  for (const sub of subcategories || []) {
    subcategoryCounts[sub.parent_id] = (subcategoryCounts[sub.parent_id] || 0) + 1
  }

  // Get listing counts per category
  const { data: listingCategories, error: lcError } = await supabase
    .from('listing_categories')
    .select('category_id, listings(is_premium)')

  if (lcError) {
    console.error('Error fetching listing categories:', lcError)
    throw lcError
  }

  // Build category to section mapping
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, parent_id')

  const categoryToSection: Record<string, string> = {}
  for (const cat of allCategories || []) {
    // If it's a section (no parent), map to itself
    // If it's a subcategory, map to its parent
    categoryToSection[cat.id] = cat.parent_id || cat.id
  }

  // Count listings per section
  const sectionCounts: Record<string, { total: number; premium: number }> = {}
  for (const lc of listingCategories || []) {
    const sectionId = categoryToSection[lc.category_id]
    if (!sectionId) continue

    if (!sectionCounts[sectionId]) {
      sectionCounts[sectionId] = { total: 0, premium: 0 }
    }
    sectionCounts[sectionId].total++
    if ((lc.listings as any)?.is_premium) {
      sectionCounts[sectionId].premium++
    }
  }

  return (sections || []).map(section => ({
    id: section.id,
    name: section.name,
    totalCount: sectionCounts[section.id]?.total || 0,
    premiumCount: sectionCounts[section.id]?.premium || 0,
    subcategoryCount: subcategoryCounts[section.id] || 0,
  }))
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

  // Get sections (parent_id = null), sorted alphabetically
  const sections = allCategories
    .filter(c => c.parent_id === null)
    .sort((a, b) => a.name.localeCompare(b.name))

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

// Get all listing→category mappings in one query
export async function getAllListingCategoryIds(): Promise<Record<string, string[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listing_categories')
    .select('listing_id, category_id')

  if (error) {
    console.error('Error fetching all listing categories:', error)
    throw error
  }

  const result: Record<string, string[]> = {}
  for (const row of data || []) {
    if (!result[row.listing_id]) result[row.listing_id] = []
    result[row.listing_id].push(row.category_id)
  }
  return result
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
