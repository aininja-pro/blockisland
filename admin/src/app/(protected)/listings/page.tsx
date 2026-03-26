import { Suspense } from 'react'
import { getListings, getCategories } from '@/lib/queries/listings'
import { getCategoriesHierarchy, getAllListingCategoryIds } from '@/lib/queries/categories'
import { ListingsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function ListingsPage() {
  const [listings, filterCategories, categories, listingCategoryIds] = await Promise.all([
    getListings(),
    getCategories(),
    getCategoriesHierarchy(),
    getAllListingCategoryIds(),
  ])

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

      <Suspense>
        <ListingsClient
          listings={listings}
          filterCategories={filterCategories}
          categories={categories}
          listingCategoryIds={listingCategoryIds}
        />
      </Suspense>
    </div>
  )
}
