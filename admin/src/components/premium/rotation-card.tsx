'use client'

import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Listing } from '@/lib/queries/listings'
import { PremiumToggle } from './premium-toggle'

interface RotationCardProps {
  category: string
  listings: Listing[]
  onToggle: (listingId: string, isPremium: boolean) => Promise<void>
  onAddMember: (category: string) => void
}

export function RotationCard({
  category,
  listings,
  onToggle,
  onAddMember,
}: RotationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{category}</CardTitle>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {listings.length} premium
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No premium members in this category</p>
        ) : (
          <ol className="space-y-2">
            {listings.map((listing, index) => (
              <li
                key={listing.id}
                className={`flex items-center justify-between p-2 rounded-md ${
                  index === 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium ${
                    index === 0
                      ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    {index === 0 && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <span className="font-medium">{listing.name}</span>
                  </div>
                </div>
                <PremiumToggle
                  listingId={listing.id}
                  isPremium={true}
                  onToggle={onToggle}
                  compact
                />
              </li>
            ))}
          </ol>
        )}
        {listings.length > 0 && listings[0] && (
          <p className="text-xs text-muted-foreground mt-3">
            Position 1 rotates to back tomorrow
          </p>
        )}
        <button
          onClick={() => onAddMember(category)}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          + Add premium member
        </button>
      </CardContent>
    </Card>
  )
}
