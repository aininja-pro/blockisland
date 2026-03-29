import { getAllCategories } from '@/lib/queries/categories'
import { getRotationSetting } from '@/lib/queries/analytics'
import { SettingsClient } from './client'

export default async function SettingsPage() {
  const [categories, rotationHours] = await Promise.all([
    getAllCategories(),
    getRotationSetting(),
  ])

  // Filter to sections only (parent_id = null), sorted by name
  const sections = categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Feed URLs and rotation configuration
        </p>
      </div>

      <SettingsClient
        sections={sections.map((s) => ({ id: s.id, name: s.name }))}
        rotationHours={rotationHours}
      />
    </div>
  )
}
