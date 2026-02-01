import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { List, Star, Layers } from 'lucide-react'

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
  subcategoryCount,
}: SectionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <List className="h-4 w-4" />
            <span>{totalCount} listings</span>
          </div>
          {premiumCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Star className="h-3 w-3 mr-1" />
              {premiumCount} premium
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="h-4 w-4" />
          <span>{subcategoryCount} subcategories</span>
        </div>
        <Link href={`/listings?category=${encodeURIComponent(name)}`}>
          <Button variant="outline" size="sm" className="w-full">
            View Listings
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
