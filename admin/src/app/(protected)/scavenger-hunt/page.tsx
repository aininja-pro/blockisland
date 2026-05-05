import { ScavengerHuntClient } from './client'

export const dynamic = 'force-dynamic'

export default async function ScavengerHuntPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Scavenger Hunt
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage hunt rotation, redemptions, analytics, and item edits
        </p>
      </div>

      <ScavengerHuntClient />
    </div>
  )
}
