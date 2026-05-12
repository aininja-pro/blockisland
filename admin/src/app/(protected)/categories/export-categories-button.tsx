'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toCsv, downloadCsv, todayStamp, type CsvColumn } from '@/lib/csv'
import type { SectionStats, SubcategoryStats } from '@/lib/queries/categories'

interface CategoryCsvRow {
  name: string
  type: 'Section' | 'Subcategory'
  parent: string
  listings: number
  premium: number
  subcategoryCount: number | ''
}

const CATEGORY_CSV_COLUMNS: CsvColumn<CategoryCsvRow>[] = [
  { header: 'Name', accessor: (r) => r.name },
  { header: 'Type', accessor: (r) => r.type },
  { header: 'Parent Section', accessor: (r) => r.parent },
  { header: 'Listings', accessor: (r) => r.listings },
  { header: 'Premium Listings', accessor: (r) => r.premium },
  { header: 'Subcategory Count', accessor: (r) => r.subcategoryCount },
]

interface ExportCategoriesButtonProps {
  sections: SectionStats[]
  subcategoriesBySection: Record<string, SubcategoryStats[]>
}

export function ExportCategoriesButton({ sections, subcategoriesBySection }: ExportCategoriesButtonProps) {
  const handleExport = () => {
    const rows: CategoryCsvRow[] = []
    for (const section of sections) {
      rows.push({
        name: section.name,
        type: 'Section',
        parent: '',
        listings: section.totalCount,
        premium: section.premiumCount,
        subcategoryCount: section.subcategoryCount,
      })
      for (const sub of subcategoriesBySection[section.id] || []) {
        rows.push({
          name: sub.name,
          type: 'Subcategory',
          parent: section.name,
          listings: sub.totalCount,
          premium: sub.premiumCount,
          subcategoryCount: '',
        })
      }
    }
    downloadCsv(`block-island-categories-${todayStamp()}.csv`, toCsv(rows, CATEGORY_CSV_COLUMNS))
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  )
}
