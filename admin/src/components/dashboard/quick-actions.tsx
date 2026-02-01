import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Star, List } from 'lucide-react'

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link href="/listings">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add New Listing
          </Button>
        </Link>
        <Link href="/premium">
          <Button variant="outline">
            <Star className="mr-2 h-4 w-4" />
            View Premium Members
          </Button>
        </Link>
        <Link href="/listings">
          <Button variant="outline">
            <List className="mr-2 h-4 w-4" />
            View All Listings
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
