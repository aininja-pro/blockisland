import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { List, Star, Folder } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get counts for dashboard stats
  const { count: listingsCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })

  const { count: premiumCount } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_premium', true)

  const { data: categories } = await supabase
    .from('listings')
    .select('category')

  const uniqueCategories = new Set(categories?.map(c => c.category) || [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Welcome to Block Island Admin
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <List className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingsCount || 0}</div>
            <CardDescription>Active business listings</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumCount || 0}</div>
            <CardDescription>Featured at top of listings</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCategories.size}</div>
            <CardDescription>Business categories</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
