import { getAdsWithStats } from '@/lib/queries/ads'
import { AdvertisingClient } from './client'

export default async function AdvertisingPage() {
  const ads = await getAdsWithStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Advertising
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage ad banners for the app home page
          </p>
        </div>
      </div>

      <AdvertisingClient ads={ads} />
    </div>
  )
}
