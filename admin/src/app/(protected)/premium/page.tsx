import { getPremiumGroupedBySection, getLastRotationDate } from '@/lib/queries/premium'
import { getCategories } from '@/lib/queries/listings'
import { PremiumClient } from './client'

export default async function PremiumPage() {
  const [premiumGroups, lastRotation, allCategories] = await Promise.all([
    getPremiumGroupedBySection(),
    getLastRotationDate(),
    getCategories(),
  ])

  const formattedDate = lastRotation
    ? lastRotation.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Premium Members
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Last rotated: {formattedDate}
        </p>
      </div>

      <PremiumClient
        premiumGroups={premiumGroups}
        allCategories={allCategories}
      />
    </div>
  )
}
