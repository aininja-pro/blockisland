'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdWithStats } from '@/lib/queries/ads'
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

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ad
        </Button>
      </div>

      <AdTable
        ads={ads}
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
