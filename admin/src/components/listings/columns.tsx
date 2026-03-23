'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, MapPin, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'
import { PremiumToggle } from '@/components/premium/premium-toggle'

interface ColumnsProps {
  onEdit: (listing: Listing) => void
  onDelete: (listing: Listing) => void
  onTogglePremium: (listingId: string, isPremium: boolean) => Promise<void>
  onTogglePublished: (listingId: string, isPublished: boolean) => Promise<void>
  onSubscriptionDateChange: (listingId: string, date: string | null) => Promise<void>
  categories: CategoryWithChildren[]
  listingCategoryIds: Record<string, string[]>
}

// Build a lookup map for category ID -> { section name, subcategory name }
function buildCategoryLookup(categories: CategoryWithChildren[]) {
  const lookup: Record<string, { section: string; subcategory: string | null }> = {}

  for (const section of categories) {
    // Section itself
    lookup[section.id] = { section: section.name, subcategory: null }

    // Subcategories
    for (const sub of section.children || []) {
      lookup[sub.id] = { section: section.name, subcategory: sub.name }
    }
  }

  return lookup
}

// Get "Appears In" display for a listing
function getAppearsIn(
  listingId: string,
  listingCategoryIds: Record<string, string[]>,
  categoryLookup: Record<string, { section: string; subcategory: string | null }>
) {
  const categoryIds = listingCategoryIds[listingId] || []
  const appearances: { section: string; subcategory: string | null }[] = []

  for (const catId of categoryIds) {
    const info = categoryLookup[catId]
    if (info) {
      // Avoid duplicates
      const exists = appearances.some(
        a => a.section === info.section && a.subcategory === info.subcategory
      )
      if (!exists) {
        appearances.push(info)
      }
    }
  }

  return appearances
}

export function getColumns({ onEdit, onDelete, onTogglePremium, onTogglePublished, onSubscriptionDateChange, categories, listingCategoryIds }: ColumnsProps): ColumnDef<Listing>[] {
  const categoryLookup = buildCategoryLookup(categories)

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'listing',
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Listing
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const listing = row.original
        const isPremium = listing.is_premium
        return (
          <div className="flex items-center gap-3">
            {/* Thumbnail */}
            <div className="h-16 w-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Name + Address */}
            <div className={`min-w-0 ${isPremium ? 'pl-2 border-l-2 border-yellow-400' : ''}`}>
              <div className="font-medium truncate">{listing.name}</div>
              {listing.address && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{listing.address}</span>
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      id: 'appearsIn',
      header: 'Appears In',
      cell: ({ row }) => {
        const listing = row.original
        const appearances = getAppearsIn(listing.id, listingCategoryIds, categoryLookup)

        if (appearances.length === 0) {
          return <span className="text-muted-foreground text-sm">Not assigned</span>
        }

        // Group by section, collect subcategories
        const grouped: Record<string, string[]> = {}
        for (const app of appearances) {
          if (!grouped[app.section]) grouped[app.section] = []
          if (app.subcategory) grouped[app.section].push(app.subcategory)
        }

        const sections = Object.keys(grouped)

        return (
          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
            {sections.slice(0, 3).map((section) => (
              <span
                key={section}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                title={grouped[section].length > 0 ? `${section}: ${grouped[section].join(', ')}` : section}
              >
                <MapPin className="h-3 w-3" />
                {section.length > 18 ? section.slice(0, 16) + '…' : section}
              </span>
            ))}
            {sections.length > 3 && (
              <span className="text-xs text-muted-foreground">+{sections.length - 3}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      cell: ({ row }) => {
        const listing = row.original
        const isPublished = listing.is_published !== false // Default to true if undefined
        return (
          <button
            onClick={() => onTogglePublished(listing.id, !isPublished)}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              isPublished
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
            }`}
          >
            {isPublished ? 'Published' : 'Draft'}
          </button>
        )
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true
        const isPublished = row.getValue(id) !== false
        if (value === 'published') return isPublished
        if (value === 'draft') return !isPublished
        return true
      },
    },
    {
      accessorKey: 'is_premium',
      header: 'Premium',
      cell: ({ row }) => {
        const listing = row.original
        return (
          <PremiumToggle
            listingId={listing.id}
            isPremium={listing.is_premium}
            onToggle={onTogglePremium}
            compact
          />
        )
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true
        if (value === 'premium') return row.getValue(id) === true
        if (value === 'basic') return row.getValue(id) === false
        return true
      },
    },
    {
      accessorKey: 'subscription_date',
      header: 'Subscription',
      cell: ({ row }) => {
        const listing = row.original
        return (
          <input
            type="date"
            defaultValue={listing.subscription_date || ''}
            onChange={(e) => {
              const value = e.target.value || null
              onSubscriptionDateChange(listing.id, value)
            }}
            className="text-sm border rounded px-2 py-1 w-[140px] bg-transparent"
          />
        )
      },
    },
    // Hidden column for filtering by legacy category
    {
      accessorKey: 'category',
      header: () => null,
      cell: () => null,
      enableHiding: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const listing = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(listing)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(listing)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
