'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ListingForm, ListingFormData } from './listing-form'
import { Listing } from '@/lib/queries/listings'
import { Subcategory } from '@/lib/queries/subcategories'
import { createListingAction, updateListingAction } from '@/app/(protected)/listings/actions'

interface ListingDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  listing: Listing | null
  subcategories: Subcategory[]
  selectedSubcategoryIds?: string[]
}

export function ListingDialog({
  open,
  onClose,
  listing,
  subcategories,
  selectedSubcategoryIds,
}: ListingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ListingFormData) => {
    setIsLoading(true)
    try {
      if (listing) {
        const result = await updateListingAction(listing.id, data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Listing updated successfully')
      } else {
        const result = await createListingAction(data)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Listing created successfully')
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
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {listing ? 'Edit Listing' : 'Add New Listing'}
          </DialogTitle>
          <DialogDescription>
            {listing
              ? 'Make changes to this listing.'
              : 'Fill in the details for the new listing.'}
          </DialogDescription>
        </DialogHeader>
        <ListingForm
          listing={listing}
          subcategories={subcategories}
          selectedSubcategoryIds={selectedSubcategoryIds}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
