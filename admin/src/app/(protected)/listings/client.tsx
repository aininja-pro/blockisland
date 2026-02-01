'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/listings/data-table'
import { getColumns } from '@/components/listings/columns'
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'
import { ListingDialog } from '@/components/listings/listing-dialog'
import { DeleteDialog } from '@/components/listings/delete-dialog'
import { togglePremiumAction, togglePublishedAction } from '@/app/(protected)/premium/actions'

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
    onTogglePremium: handleTogglePremium,
    onTogglePublished: handleTogglePublished,
    categories,
    listingCategoryIds,
  })

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
