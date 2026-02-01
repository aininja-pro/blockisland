import { getListings, getCategories, Listing } from '@/lib/queries/listings'
import { ListingsClient } from './client'

export default async function ListingsPage() {
  const [listings, categories] = await Promise.all([
    getListings(),
    getCategories(),
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

      <ListingsClient listings={listings} categories={categories} />
    </div>
  )
}
