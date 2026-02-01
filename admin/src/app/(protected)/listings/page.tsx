import { getListings, getCategories } from '@/lib/queries/listings'
import { getCategoriesHierarchy, getListingCategoryIds } from '@/lib/queries/categories'
import { ListingsClient } from './client'

export default async function ListingsPage() {
  const [listings, filterCategories, categories] = await Promise.all([
    getListings(),
    getCategories(),
    getCategoriesHierarchy(),
  ])

  // Fetch category assignments for all listings
  const listingCategoryIds: Record<string, string[]> = {}
  await Promise.all(
    listings.map(async (listing) => {
      listingCategoryIds[listing.id] = await getListingCategoryIds(listing.id)
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
        filterCategories={filterCategories}
        categories={categories}
        listingCategoryIds={listingCategoryIds}
      />
    </div>
  )
}
