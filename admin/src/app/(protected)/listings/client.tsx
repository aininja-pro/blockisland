'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/listings/data-table'
import { getColumns } from '@/components/listings/columns'
import { Listing } from '@/lib/queries/listings'
import { Subcategory } from '@/lib/queries/subcategories'
import { ListingDialog } from '@/components/listings/listing-dialog'
import { DeleteDialog } from '@/components/listings/delete-dialog'
import { togglePremiumAction } from '@/app/(protected)/premium/actions'

interface ListingsClientProps {
  listings: Listing[]
  categories: string[]
  subcategories: Subcategory[]
  listingSubcategories: Record<string, string[]>
}

export function ListingsClient({ listings, categories, subcategories, listingSubcategories }: ListingsClientProps) {
  const router = useRouter()
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [deleteListing, setDeleteListing] = useState<Listing | null>(null)
  const [bulkDeleteListings, setBulkDeleteListings] = useState<Listing[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([])

  const handleEdit = (listing: Listing) => {
    setEditListing(listing)
    setSelectedSubcategoryIds(listingSubcategories[listing.id] || [])
    setDialogOpen(true)
  }

  const handleDelete = (listing: Listing) => {
    setDeleteListing(listing)
  }

  const handleCreate = () => {
    setEditListing(null)
    setSelectedSubcategoryIds([])
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
        categories={categories}
        onBulkDelete={handleBulkDelete}
      />

      <ListingDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        listing={editListing}
        subcategories={subcategories}
        selectedSubcategoryIds={selectedSubcategoryIds}
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
