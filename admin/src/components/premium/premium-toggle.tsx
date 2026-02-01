'use client'

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface PremiumToggleProps {
  listingId: string
  isPremium: boolean
  onToggle: (listingId: string, isPremium: boolean) => Promise<void>
  compact?: boolean
}

export function PremiumToggle({
  listingId,
  isPremium,
  onToggle,
  compact = false,
}: PremiumToggleProps) {
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(isPremium)

  const handleToggle = async (newValue: boolean) => {
    setLoading(true)
    setChecked(newValue)
    try {
      await onToggle(listingId, newValue)
    } catch (error) {
      setChecked(isPremium) // Revert on error
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <Switch
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={loading}
        className="data-[state=checked]:bg-yellow-500"
      />
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`premium-${listingId}`}
        checked={checked}
        onCheckedChange={handleToggle}
        disabled={loading}
        className="data-[state=checked]:bg-yellow-500"
      />
      <Label htmlFor={`premium-${listingId}`} className="text-sm">
        {checked ? 'Premium' : 'Basic'}
      </Label>
    </div>
  )
}
