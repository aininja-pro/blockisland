import { getCategoryStats } from '@/lib/queries/categories'
import { CategoryCard } from '@/components/categories/category-card'
import { Folder } from 'lucide-react'

export default async function CategoriesPage() {
  const categories = await getCategoryStats()

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Categories
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View business categories and their listings
          </p>
        </div>

        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-50">
            No categories yet
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Categories are created automatically when you add listings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Categories
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {categories.length} categories • Categories are determined by your listings
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.category}
            category={category.category}
            totalCount={category.totalCount}
            premiumCount={category.premiumCount}
          />
        ))}
      </div>
    </div>
  )
}
