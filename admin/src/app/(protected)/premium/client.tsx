'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Star, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
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
import type { PremiumGrouped } from '@/lib/queries/premium'

interface PremiumClientProps {
  premiumGroups: PremiumGrouped[]
  allCategories: string[]
}

export function PremiumClient({
  premiumGroups,
  allCategories,
}: PremiumClientProps) {
  const router = useRouter()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)

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

  const totalListings = premiumGroups.reduce((sum, g) => sum + g.listings.length, 0)

  if (premiumGroups.length === 0) {
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
            <col />
            <col className="w-[100px]" />
            <col className="w-[160px]" />
            <col className="w-[80px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-4 text-xs uppercase tracking-wider text-muted-foreground">Listing</TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-wider text-muted-foreground text-center">Position</TableHead>
              <TableHead className="px-4 text-xs uppercase tracking-wider text-muted-foreground">Subscribed</TableHead>
              <TableHead className="px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premiumGroups.map((group) => (
              <React.Fragment key={group.section}>
                {/* Category group header */}
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell className="px-4 py-2" colSpan={4}>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.section}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({group.listings.length} {group.listings.length === 1 ? 'listing' : 'listings'})
                    </span>
                  </TableCell>
                </TableRow>
                {/* Listings in this category */}
                {group.listings.map((listing) => (
                  <TableRow key={`${group.section}-${listing.id}`}>
                    <TableCell className="px-4 pl-8">
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
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>

      <p className="text-sm text-muted-foreground">
        {totalListings} premium {totalListings === 1 ? 'listing' : 'listings'} across {premiumGroups.length} {premiumGroups.length === 1 ? 'category' : 'categories'}
      </p>

      <AddPremiumDialog
        open={addDialogOpen}
        onClose={handleDialogClose}
        category={selectedCategory}
      />
    </>
  )
}

