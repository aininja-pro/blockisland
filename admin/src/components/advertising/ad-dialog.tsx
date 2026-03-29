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
import { AdForm, AdFormData } from './ad-form'
import { type Ad, type AdSlot } from '@/lib/queries/ad-types'
import { type SectionWithSlug } from '@/lib/queries/categories'
import { createAdAction, updateAdAction } from '@/app/(protected)/advertising/actions'

interface AdDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  ad: Ad | null
  defaultSlot?: AdSlot
  sections: SectionWithSlug[]
}

export function AdDialog({ open, onClose, ad, defaultSlot, sections }: AdDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: AdFormData) => {
    setIsLoading(true)
    try {
      const actionData = {
        title: data.title,
        slot: data.slot,
        image_url: data.image_url,
        destination_url: data.destination_url || '',
        is_active: data.is_active,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        link_type: data.link_type,
        linked_listing_id: data.link_type === 'internal' ? (data.linked_listing_id || null) : null,
      }

      if (ad) {
        const result = await updateAdAction(ad.id, actionData)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Ad updated successfully')
      } else {
        const result = await createAdAction(actionData)
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success('Ad created successfully')
      }
      onClose(true)
    } catch {
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ad ? 'Edit Ad' : 'Add New Ad'}
          </DialogTitle>
          <DialogDescription>
            {ad
              ? 'Make changes to this ad.'
              : 'Fill in the details for the new ad banner.'}
          </DialogDescription>
        </DialogHeader>
        <AdForm
          ad={ad}
          defaultSlot={defaultSlot}
          sections={sections}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
