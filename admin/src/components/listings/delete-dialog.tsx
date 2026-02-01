'use client'

import { Listing } from '@/lib/queries/listings'

interface DeleteDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  listing: Listing | null
  listings: Listing[]
}

export function DeleteDialog({ open, onClose, listing, listings }: DeleteDialogProps) {
  // Placeholder - will be implemented in Task 3
  if (!open) return null
  return null
}
