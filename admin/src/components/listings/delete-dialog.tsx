'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
import { Listing } from '@/lib/queries/listings'
import { deleteListingAction, deleteListingsAction } from '@/app/(protected)/listings/actions'

interface DeleteDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  listing: Listing | null
  listings: Listing[]
}

export function DeleteDialog({
  open,
  onClose,
  listing,
  listings,
}: DeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isBulk = listings.length > 0
  const count = isBulk ? listings.length : 1
  const name = listing?.name || `${count} listings`

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      if (isBulk) {
        const ids = listings.map((l) => l.id)
        const result = await deleteListingsAction(ids)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success(`${count} listings deleted`)
      } else if (listing) {
        const result = await deleteListingAction(listing.id)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Listing deleted')
      }
      onClose(true)
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? `Delete ${count} listings?` : 'Delete listing?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? (
              <>
                Are you sure you want to delete {count} selected listings? This action
                cannot be undone.
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{name}</strong>? This action
                cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
