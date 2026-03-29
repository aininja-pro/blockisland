import { getAdsWithStats } from '@/lib/queries/ads'
import { getSectionsWithSlug } from '@/lib/queries/categories'
import { getListingAnalytics } from '@/lib/queries/analytics'
import { AdvertisingClient } from './client'
import { deactivateExpiredAdsAction } from './actions'

export default async function AdvertisingPage() {
  await deactivateExpiredAdsAction()

  // Default analytics period: last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const periodStart = thirtyDaysAgo.toISOString()
  const periodEnd = now.toISOString()

  const [ads, sections, analytics] = await Promise.all([
    getAdsWithStats(),
    getSectionsWithSlug(),
    getListingAnalytics(periodStart, periodEnd),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Advertising
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage ads and view listing analytics
          </p>
        </div>
      </div>

      <AdvertisingClient ads={ads} sections={sections} initialAnalytics={analytics} />
    </div>
  )
}
