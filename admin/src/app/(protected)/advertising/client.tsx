'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type AdWithStats, AD_SLOT_LABELS, type AdSlot } from '@/lib/queries/ad-types'
import { AdTable } from '@/components/advertising/ad-table'
import { AdDialog } from '@/components/advertising/ad-dialog'
import { DeleteAdDialog } from '@/components/advertising/delete-ad-dialog'
import { duplicateAdAction, toggleAdActiveAction } from './actions'

const SLOT_DESCRIPTIONS: Record<AdSlot, string> = {
  top_banner: 'Thin strip above all category tiles — 750 x 120 px',
  middle_block: 'Tile-sized block between category tiles — 750 x 360 px',
  bottom_block: 'Tile-sized block near the end of scroll — 750 x 360 px',
}

const SLOTS: AdSlot[] = ['top_banner', 'middle_block', 'bottom_block']

interface AdvertisingClientProps {
  ads: AdWithStats[]
}

export function AdvertisingClient({ ads }: AdvertisingClientProps) {
  const router = useRouter()
  const [editAd, setEditAd] = useState<AdWithStats | null>(null)
  const [deleteAd, setDeleteAd] = useState<AdWithStats | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defaultSlot, setDefaultSlot] = useState<AdSlot>('middle_block')

  const handleEdit = (ad: AdWithStats) => {
    setEditAd(ad)
    setDialogOpen(true)
  }

  const handleDelete = (ad: AdWithStats) => {
    setDeleteAd(ad)
  }

  const handleCreateForSlot = (slot: AdSlot) => {
    setEditAd(null)
    setDefaultSlot(slot)
    setDialogOpen(true)
  }

  const handleToggleActive = async (adId: string, isActive: boolean) => {
    const result = await toggleAdActiveAction(adId, isActive)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(isActive ? 'Ad activated' : 'Ad deactivated')
    router.refresh()
  }

  const handleDuplicate = async (ad: AdWithStats) => {
    const result = await duplicateAdAction(ad.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Ad duplicated')
    router.refresh()
  }

  const handleDialogClose = (refresh?: boolean) => {
    setDialogOpen(false)
    setEditAd(null)
    if (refresh) {
      router.refresh()
    }
  }

  const handleDeleteClose = (refresh?: boolean) => {
    setDeleteAd(null)
    if (refresh) {
      router.refresh()
    }
  }

  return (
    <>
      <div className="space-y-6">
        {SLOTS.map((slot) => {
          const slotAds = ads.filter((ad) => ad.slot === slot)
          return (
            <Card key={slot}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">{AD_SLOT_LABELS[slot]}</CardTitle>
                  <CardDescription>{SLOT_DESCRIPTIONS[slot]}</CardDescription>
                </div>
                <Button size="sm" onClick={() => handleCreateForSlot(slot)}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Ad
                </Button>
              </CardHeader>
              <CardContent>
                <AdTable
                  ads={slotAds}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onDuplicate={handleDuplicate}
                  hideSlotColumn
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AdDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        ad={editAd}
        defaultSlot={defaultSlot}
      />

      <DeleteAdDialog
        open={!!deleteAd}
        onClose={handleDeleteClose}
        ad={deleteAd}
      />
    </>
  )
}
