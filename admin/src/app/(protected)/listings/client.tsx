'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/listings/data-table'
import { getColumns } from '@/components/listings/columns'
import { Listing } from '@/lib/queries/listings'
import { ListingDialog } from '@/components/listings/listing-dialog'
import { DeleteDialog } from '@/components/listings/delete-dialog'

interface ListingsClientProps {
  listings: Listing[]
  categories: string[]
}

export function ListingsClient({ listings, categories }: ListingsClientProps) {
  const router = useRouter()
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [deleteListing, setDeleteListing] = useState<Listing | null>(null)
  const [bulkDeleteListings, setBulkDeleteListings] = useState<Listing[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEdit = (listing: Listing) => {
    setEditListing(listing)
    setDialogOpen(true)
  }

  const handleDelete = (listing: Listing) => {
    setDeleteListing(listing)
  }

  const handleCreate = () => {
    setEditListing(null)
    setDialogOpen(true)
  }

  const handleBulkDelete = (listings: Listing[]) => {
    setBulkDeleteListings(listings)
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
        categories={categories}
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
