'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Star, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteSection } from '@/app/(protected)/categories/actions'
import { toast } from 'sonner'

interface Section {
  id: string
  name: string
  totalCount: number
  premiumCount: number
  subcategoryCount: number
}

type SortKey = 'name' | 'totalCount' | 'premiumCount'
type SortDir = 'asc' | 'desc'

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />
}

export function SectionsTable({ sections: initialSections }: { sections: Section[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sorted = [...initialSections].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
    return mul * (a[sortKey] - b[sortKey])
  })

  const totalListings = initialSections.reduce((sum, s) => sum + s.totalCount, 0)
  const totalPremium = initialSections.reduce((sum, s) => sum + s.premiumCount, 0)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteSection(deleteTarget.id)
      toast.success(`Deleted "${deleteTarget.name}" section`)
    } catch {
      toast.error('Failed to delete section')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Card className="py-0 overflow-hidden">
        <Table>
          <colgroup>
            <col />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[180px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-4">
                <button onClick={() => handleSort('name')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Section
                  <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('totalCount')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  Listings
                  <SortIcon column="totalCount" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('premiumCount')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  Premium
                  <SortIcon column="premiumCount" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((section) => (
              <TableRow key={section.id}>
                <TableCell className="px-4">
                  <div>
                    <span className="font-medium">{section.name}</span>
                    {section.subcategoryCount > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.subcategoryCount} {section.subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 text-center tabular-nums text-muted-foreground">
                  {section.totalCount}
                </TableCell>
                <TableCell className="px-4 text-center">
                  {section.premiumCount > 0 ? (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {section.premiumCount}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/listings?category=${encodeURIComponent(section.name)}`}>
                        View Listings
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(section)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-4 font-medium">Total</TableCell>
              <TableCell className="px-4 text-center tabular-nums font-medium">{totalListings}</TableCell>
              <TableCell className="px-4 text-center tabular-nums font-medium">{totalPremium}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section
              {deleteTarget && deleteTarget.subcategoryCount > 0 && ` and its ${deleteTarget.subcategoryCount} ${deleteTarget.subcategoryCount === 1 ? 'subcategory' : 'subcategories'}`}.
              Listings will not be deleted but will lose their category assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
