import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

interface SectionCardProps {
  name: string
  totalCount: number
  premiumCount: number
  subcategoryCount: number
}

export function SectionCard({
  name,
  totalCount,
  premiumCount,
}: SectionCardProps) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50">
      <td className="py-2.5 px-4 text-sm font-medium">{name}</td>
      <td className="py-2.5 px-4 text-sm text-muted-foreground tabular-nums">{totalCount}</td>
      <td className="py-2.5 px-4">
        {premiumCount > 0 ? (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
            <Star className="h-3 w-3 mr-1" />
            {premiumCount}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 px-4 text-right">
        <Link
          href={`/listings?category=${encodeURIComponent(name)}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View Listings &rarr;
        </Link>
      </td>
    </tr>
  )
}
