'use client'

import { Listing } from '@/lib/queries/listings'

interface ListingDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  listing: Listing | null
  categories: string[]
}

export function ListingDialog({ open, onClose, listing, categories }: ListingDialogProps) {
  // Placeholder - will be implemented in Task 2
  if (!open) return null
  return null
}
