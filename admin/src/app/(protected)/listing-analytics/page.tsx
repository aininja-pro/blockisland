import { getListingAnalytics } from '@/lib/queries/analytics'
import { ListingAnalyticsClient } from './client'

export default async function ListingAnalyticsPage() {
  // Default analytics period: last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const periodStart = thirtyDaysAgo.toISOString()
  const periodEnd = now.toISOString()

  const analytics = await getListingAnalytics(periodStart, periodEnd)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Listing Analytics
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Page views and CTA clicks across all published listings
        </p>
      </div>

      <ListingAnalyticsClient initialAnalytics={analytics} />
    </div>
  )
}
