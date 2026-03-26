'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Star, ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PremiumToggle } from '@/components/premium/premium-toggle'
import { AddPremiumDialog } from '@/components/premium/add-premium-dialog'
import { togglePremiumAction } from './actions'
import type { Listing } from '@/lib/queries/listings'

type SortKey = 'category' | 'name' | 'rotation_position' | 'subscription_date'
type SortDir = 'asc' | 'desc'

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />
}

interface PremiumClientProps {
  premiumListings: Listing[]
  allCategories: string[]
}

export function PremiumClient({
  premiumListings,
  allCategories,
}: PremiumClientProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('category')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'category' ? 'asc' : 'asc')
    }
  }

  const sorted = [...premiumListings].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'category':
        return mul * a.category.localeCompare(b.category) || (a.rotation_position || 0) - (b.rotation_position || 0)
      case 'name':
        return mul * a.name.localeCompare(b.name)
      case 'rotation_position':
        return mul * ((a.rotation_position || 0) - (b.rotation_position || 0))
      case 'subscription_date':
        return mul * ((a.subscription_date || '').localeCompare(b.subscription_date || ''))
      default:
        return 0
    }
  })

  const handleToggle = async (listingId: string, isPremium: boolean) => {
    const result = await togglePremiumAction(listingId, isPremium)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success('Removed from premium')
    router.refresh()
  }

  const handleAddClick = (category: string) => {
    setSelectedCategory(category)
    setAddDialogOpen(true)
    setCategoryPickerOpen(false)
  }

  const handleDialogClose = (refresh?: boolean) => {
    setAddDialogOpen(false)
    setSelectedCategory(null)
    if (refresh) {
      router.refresh()
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (premiumListings.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-50">
          No premium members yet
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Add premium members to enable featured placement with daily rotation.
        </p>
        <Link href="/listings">
          <Button className="mt-4">Go to Listings</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <Select
          open={categoryPickerOpen}
          onOpenChange={setCategoryPickerOpen}
          onValueChange={handleAddClick}
        >
          <SelectTrigger className="w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Add Premium Member" />
          </SelectTrigger>
          <SelectContent>
            {allCategories.filter(Boolean).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0 overflow-hidden">
        <Table>
          <colgroup>
            <col className="w-[25%]" />
            <col />
            <col className="w-[100px]" />
            <col className="w-[160px]" />
            <col className="w-[80px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-4">
                <button onClick={() => handleSort('category')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Category
                  <SortIcon column="category" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('name')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Listing
                  <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('rotation_position')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  Position
                  <SortIcon column="rotation_position" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('subscription_date')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Subscribed
                  <SortIcon column="subscription_date" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="px-4 text-sm text-muted-foreground">
                  {listing.category}
                </TableCell>
                <TableCell className="px-4">
                  <span className="font-medium">{listing.name}</span>
                </TableCell>
                <TableCell className="px-4 text-center">
                  {listing.rotation_position === 1 ? (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      1
                    </Badge>
                  ) : (
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {listing.rotation_position || '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 text-sm text-muted-foreground">
                  {formatDate(listing.subscription_date)}
                </TableCell>
                <TableCell className="px-4">
                  <PremiumToggle
                    listingId={listing.id}
                    isPremium={true}
                    onToggle={handleToggle}
                    compact
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-4 font-medium" colSpan={2}>
                {premiumListings.length} premium {premiumListings.length === 1 ? 'listing' : 'listings'}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <AddPremiumDialog
        open={addDialogOpen}
        onClose={handleDialogClose}
        category={selectedCategory}
      />
    </>
  )
}
