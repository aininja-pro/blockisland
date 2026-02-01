'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { RotationCard } from '@/components/premium/rotation-card'
import { AddPremiumDialog } from '@/components/premium/add-premium-dialog'
import { PremiumByCategory } from '@/lib/queries/premium'
import { togglePremiumAction } from './actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PremiumClientProps {
  premiumByCategory: PremiumByCategory[]
  allCategories: string[]
}

export function PremiumClient({
  premiumByCategory,
  allCategories,
}: PremiumClientProps) {
  const router = useRouter()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleToggle = async (listingId: string, isPremium: boolean) => {
    const result = await togglePremiumAction(listingId, isPremium)
    if (result.error) {
      toast.error(result.error)
      throw new Error(result.error)
    }
    toast.success(isPremium ? 'Added to premium' : 'Removed from premium')
    router.refresh()
  }

  const handleAddMember = (category: string) => {
    setSelectedCategory(category)
    setAddDialogOpen(true)
  }

  const handleDialogClose = (refresh?: boolean) => {
    setAddDialogOpen(false)
    setSelectedCategory(null)
    if (refresh) {
      router.refresh()
    }
  }

  // Get categories that have no premium members
  const categoriesWithoutPremium = allCategories.filter(
    (cat) => !premiumByCategory.find((p) => p.category === cat)
  )

  if (premiumByCategory.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-50">
          No premium members yet
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Add premium members to enable featured placement with daily rotation.
        </p>
        <Link href="/listings">
          <Button className="mt-4">Go to Listings</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {premiumByCategory.map(({ category, listings }) => (
          <RotationCard
            key={category}
            category={category}
            listings={listings}
            onToggle={handleToggle}
            onAddMember={handleAddMember}
          />
        ))}
      </div>

      {categoriesWithoutPremium.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
            Categories without premium members
          </h3>
          <div className="flex flex-wrap gap-2">
            {categoriesWithoutPremium.map((category) => (
              <button
                key={category}
                onClick={() => handleAddMember(category)}
                className="text-sm px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                + {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <AddPremiumDialog
        open={addDialogOpen}
        onClose={handleDialogClose}
        category={selectedCategory}
      />
    </>
  )
}
