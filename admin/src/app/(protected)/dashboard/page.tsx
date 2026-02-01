import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getRecentlyUpdated } from '@/lib/queries/dashboard'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { List, Star, Folder, Calendar } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [stats, recentListings] = await Promise.all([
    getDashboardStats(),
    getRecentlyUpdated(5),
  ])

  const lastRotationDisplay = stats.lastRotation
    ? stats.lastRotation.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome back, {user?.email}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Listings"
          value={stats.totalListings}
          icon={List}
          description="Active business listings"
        />
        <StatsCard
          title="Premium Members"
          value={stats.premiumMembers}
          icon={Star}
          description="Featured at top of listings"
          badge={stats.premiumMembers > 0 ? 'Active' : undefined}
        />
        <StatsCard
          title="Categories"
          value={stats.categoriesCount}
          icon={Folder}
          description="Business categories"
        />
        <StatsCard
          title="Last Rotation"
          value={lastRotationDisplay}
          icon={Calendar}
          description="Premium rotation date"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickActions />
        <RecentActivity listings={recentListings} />
      </div>
    </div>
  )
}
