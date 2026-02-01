import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Listing } from '@/lib/queries/listings'

interface RecentActivityProps {
  listings: Listing[]
}

export function RecentActivity({ listings }: RecentActivityProps) {
  if (listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {listings.map((listing) => {
            const updatedDate = new Date(listing.updated_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            return (
              <div
                key={listing.id}
                className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <Link
                    href={`/listings?edit=${listing.id}`}
                    className="font-medium hover:underline"
                  >
                    {listing.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Updated {updatedDate}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {listing.category}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
