'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type AdWithStats, AD_SLOT_LABELS, type AdSlot } from '@/lib/queries/ad-types'
import { AdTable } from '@/components/advertising/ad-table'
import { AdDialog } from '@/components/advertising/ad-dialog'
import { DeleteAdDialog } from '@/components/advertising/delete-ad-dialog'
import { toggleAdActiveAction } from './actions'

interface AdvertisingClientProps {
  ads: AdWithStats[]
}

export function AdvertisingClient({ ads }: AdvertisingClientProps) {
  const router = useRouter()
  const [editAd, setEditAd] = useState<AdWithStats | null>(null)
  const [deleteAd, setDeleteAd] = useState<AdWithStats | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [slotFilter, setSlotFilter] = useState<string>('all')

  const handleEdit = (ad: AdWithStats) => {
    setEditAd(ad)
    setDialogOpen(true)
  }

  const handleDelete = (ad: AdWithStats) => {
    setDeleteAd(ad)
  }

  const handleCreate = () => {
    setEditAd(null)
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

  const filteredAds = slotFilter === 'all'
    ? ads
    : ads.filter((ad) => ad.slot === slotFilter)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Select value={slotFilter} onValueChange={setSlotFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Slots</SelectItem>
            {(Object.entries(AD_SLOT_LABELS) as [AdSlot, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ad
        </Button>
      </div>

      <AdTable
        ads={filteredAds}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      <AdDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        ad={editAd}
      />

      <DeleteAdDialog
        open={!!deleteAd}
        onClose={handleDeleteClose}
        ad={deleteAd}
      />
    </>
  )
}
