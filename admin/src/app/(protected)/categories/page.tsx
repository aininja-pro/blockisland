import { getSectionStats } from '@/lib/queries/categories'
import { SectionCard } from '@/components/categories/section-card'
import { AddSectionButton } from './add-section-button'
import { Folder } from 'lucide-react'

export default async function CategoriesPage() {
  const sections = await getSectionStats()

  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              Sections
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View business sections and their listings
            </p>
          </div>
          <AddSectionButton />
        </div>

        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-50">
            No sections yet
          </h3>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Click "Add Section" to create your first section.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Sections
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {sections.length} sections
          </p>
        </div>
        <AddSectionButton />
      </div>

      <div className="rounded-md border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-2 px-4">Section</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-2 px-4 w-[80px]">Listings</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-2 px-4 w-[100px]">Premium</th>
              <th className="w-[110px] py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                name={section.name}
                totalCount={section.totalCount}
                premiumCount={section.premiumCount}
                subcategoryCount={section.subcategoryCount}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
