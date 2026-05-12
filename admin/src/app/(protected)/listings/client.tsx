'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/listings/data-table'
import { getColumns, buildCategoryLookup, getAppearsIn } from '@/components/listings/columns'
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'
import { todayStamp, type CsvColumn } from '@/lib/csv'
import { ListingDialog } from '@/components/listings/listing-dialog'
import { DeleteDialog } from '@/components/listings/delete-dialog'
import { togglePremiumAction, togglePublishedAction } from '@/app/(protected)/premium/actions'
import { updateSubscriptionDateAction, cloneListingAction } from '@/app/(protected)/listings/actions'

interface ListingsClientProps {
  listings: Listing[]
  filterCategories: string[]
  categories: CategoryWithChildren[]
  listingCategoryIds: Record<string, string[]>
}

export function ListingsClient({ listings, filterCategories, categories, listingCategoryIds }: ListingsClientProps) {
  const router = useRouter()
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [deleteListing, setDeleteListing] = useState<Listing | null>(null)
  const [bulkDeleteListings, setBulkDeleteListings] = useState<Listing[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const handleEdit = (listing: Listing) => {
    setEditListing(listing)
    setSelectedCategoryIds(listingCategoryIds[listing.id] || [])
    setDialogOpen(true)
  }

  const handleDelete = (listing: Listing) => {
    setDeleteListing(listing)
  }

  const handleCreate = () => {
    setEditListing(null)
    setSelectedCategoryIds([])
    setDialogOpen(true)
  }

  const handleBulkDelete = (listings: Listing[]) => {
    setBulkDeleteListings(listings)
  }

  const handleClone = async (listing: Listing) => {
    const result = await cloneListingAction(listing.id)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      toast.success('Listing duplicated')
      router.refresh()
    }
  }

  const handleTogglePremium = async (listingId: string, isPremium: boolean) => {
    const result = await togglePremiumAction(listingId, isPremium)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success(isPremium ? 'Added to premium' : 'Removed from premium')
    router.refresh()
  }

  const handleTogglePublished = async (listingId: string, isPublished: boolean) => {
    const result = await togglePublishedAction(listingId, isPublished)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success(isPublished ? 'Listing published' : 'Listing set to draft')
    router.refresh()
  }

  const handleSubscriptionDateChange = async (listingId: string, date: string | null) => {
    const result = await updateSubscriptionDateAction(listingId, date)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success('Subscription date updated')
    router.refresh()
  }

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false)
    setEditListing(null)
    if (refresh) {
      router.refresh()
    }
  }

  const handleDeleteClose = (refresh?: boolean) => {
    setDeleteListing(null)
    setBulkDeleteListings([])
    if (refresh) {
      router.refresh()
    }
  }

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onClone: handleClone,
    onTogglePremium: handleTogglePremium,
    onTogglePublished: handleTogglePublished,
    onSubscriptionDateChange: handleSubscriptionDateChange,
    categories,
    listingCategoryIds,
  })

  // CSV export columns (blueprint 4.1) — Section/Categories resolved from the
  // listing_categories junction, matching the "Appears In" table column.
  const categoryLookup = buildCategoryLookup(categories)
  const csvColumns: CsvColumn<Listing>[] = [
    { header: 'Name', accessor: (l) => l.name },
    { header: 'Address', accessor: (l) => l.address ?? '' },
    { header: 'Status', accessor: (l) => (l.is_published !== false ? 'Published' : 'Draft') },
    { header: 'Tier', accessor: (l) => (l.is_premium ? 'Premium' : 'Basic') },
    {
      header: 'Section',
      accessor: (l) => {
        const apps = getAppearsIn(l.id, listingCategoryIds, categoryLookup)
        return Array.from(new Set(apps.map((a) => a.section))).join('; ')
      },
    },
    {
      header: 'Categories',
      accessor: (l) => {
        const apps = getAppearsIn(l.id, listingCategoryIds, categoryLookup)
        const subs = apps.map((a) => a.subcategory).filter((s): s is string => !!s)
        return Array.from(new Set(subs)).join('; ')
      },
    },
  ]

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Listing
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={listings}
        categories={filterCategories}
        sectionCategories={categories}
        listingCategoryIds={listingCategoryIds}
        onBulkDelete={handleBulkDelete}
        onRowClick={handleEdit}
        csvExport={{ filename: () => `block-island-listings-${todayStamp()}.csv`, columns: csvColumns }}
      />

      <ListingDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        listing={editListing}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />

      <DeleteDialog
        open={!!deleteListing || bulkDeleteListings.length > 0}
        onClose={handleDeleteClose}
        listing={deleteListing}
        listings={bulkDeleteListings}
      />
    </>
  )
}
