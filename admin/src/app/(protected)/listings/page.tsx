import { getListings, getCategories } from '@/lib/queries/listings'
import { getAllSubcategories, getListingSubcategories } from '@/lib/queries/subcategories'
import { ListingsClient } from './client'

export default async function ListingsPage() {
  const [listings, categories, subcategories] = await Promise.all([
    getListings(),
    getCategories(),
    getAllSubcategories(),
  ])

  // Fetch subcategory assignments for all listings
  const listingSubcategories: Record<string, string[]> = {}
  await Promise.all(
    listings.map(async (listing) => {
      listingSubcategories[listing.id] = await getListingSubcategories(listing.id)
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Listings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage all business listings
          </p>
        </div>
      </div>

      <ListingsClient
        listings={listings}
        categories={categories}
        subcategories={subcategories}
        listingSubcategories={listingSubcategories}
      />
    </div>
  )
}
