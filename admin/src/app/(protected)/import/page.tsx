import { getCategoriesHierarchy } from '@/lib/queries/categories'
import { ImportClient } from './import-client'

export default async function ImportPage() {
  const categories = await getCategoriesHierarchy()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bulk Import</h2>
        <p className="text-muted-foreground">
          Paste tab-separated listings from a spreadsheet to create multiple listings at once.
        </p>
      </div>
      <ImportClient categories={categories} />
    </div>
  )
}
