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
import { type Ad } from '@/lib/queries/ad-types'
import { deleteAdAction } from '@/app/(protected)/advertising/actions'

interface DeleteAdDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  ad: Ad | null
}

export function DeleteAdDialog({ open, onClose, ad }: DeleteAdDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!ad) return

    setIsLoading(true)
    try {
      const result = await deleteAdAction(ad.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Ad deleted')
      onClose(true)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete ad?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{ad?.title}</strong>? This
            will also delete all impression and click tracking data. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onClose(false)} disabled={isLoading}>
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
