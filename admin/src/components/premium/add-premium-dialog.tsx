'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Listing } from '@/lib/queries/listings'
import { togglePremiumAction } from '@/app/(protected)/premium/actions'
import { createClient } from '@/lib/supabase/client'

interface AddPremiumDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  category: string | null
}

export function AddPremiumDialog({
  open,
  onClose,
  category,
}: AddPremiumDialogProps) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (open && category) {
      fetchNonPremiumListings()
    }
  }, [open, category])

  const fetchNonPremiumListings = async () => {
    if (!category) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('category', category)
        .eq('is_premium', false)
        .order('name')

      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPremium = async (listingId: string) => {
    setAddingId(listingId)
    try {
      const result = await togglePremiumAction(listingId, true)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Added to premium')
      onClose(true)
    } catch (error) {
      toast.error('Failed to add to premium')
    } finally {
      setAddingId(null)
    }
  }

  const filteredListings = listings.filter((listing) =>
    listing.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Premium Member</DialogTitle>
          <DialogDescription>
            Select a listing from {category} to add to premium rotation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                Loading...
              </p>
            ) : filteredListings.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {listings.length === 0
                  ? 'All listings in this category are already premium'
                  : 'No matching listings'}
              </p>
            ) : (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-800"
                >
                  <span className="text-sm font-medium">{listing.name}</span>
                  <Button
                    size="sm"
                    onClick={() => handleAddPremium(listing.id)}
                    disabled={addingId === listing.id}
                  >
                    {addingId === listing.id ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
