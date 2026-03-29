'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Download, Star, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { type AdWithStats, AD_SLOT_LABELS, type AdSlot } from '@/lib/queries/ad-types'
import { type SectionWithSlug } from '@/lib/queries/categories'
import { type ListingAnalytics } from '@/lib/queries/analytics'
import { AdTable } from '@/components/advertising/ad-table'
import { AdDialog } from '@/components/advertising/ad-dialog'
import { DeleteAdDialog } from '@/components/advertising/delete-ad-dialog'
import { duplicateAdAction, toggleAdActiveAction, getListingAnalyticsAction } from './actions'

const SLOT_DESCRIPTIONS: Record<AdSlot, string> = {
  top_banner: 'Thin strip above all category tiles — 750 x 120 px',
  middle_block: 'Tile-sized block between category tiles — 750 x 360 px',
  bottom_block: 'Tile-sized block near the end of scroll — 750 x 360 px',
}

const SLOTS: AdSlot[] = ['top_banner', 'middle_block', 'bottom_block']

type TimePeriod = '7d' | '30d' | '90d' | 'all' | 'custom'
type SortField = 'name' | 'category_name' | 'is_premium' | 'views' | 'cta_clicks'
type SortDir = 'asc' | 'desc'

interface AdvertisingClientProps {
  ads: AdWithStats[]
  sections: SectionWithSlug[]
  initialAnalytics: ListingAnalytics[]
}

function getDateRange(period: TimePeriod): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()
  switch (period) {
    case '7d':
      return { start: new Date(now.getTime() - 7 * 86400000).toISOString(), end }
    case '30d':
      return { start: new Date(now.getTime() - 30 * 86400000).toISOString(), end }
    case '90d':
      return { start: new Date(now.getTime() - 90 * 86400000).toISOString(), end }
    case 'all':
      return { start: '2020-01-01T00:00:00.000Z', end }
    default:
      return { start: new Date(now.getTime() - 30 * 86400000).toISOString(), end }
  }
}

function formatDateForFilename(iso: string): string {
  return iso.split('T')[0]
}

export function AdvertisingClient({ ads, sections, initialAnalytics }: AdvertisingClientProps) {
  const router = useRouter()
  const [editAd, setEditAd] = useState<AdWithStats | null>(null)
  const [deleteAd, setDeleteAd] = useState<AdWithStats | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [defaultSlot, setDefaultSlot] = useState<AdSlot>('middle_block')

  // Analytics state
  const [analytics, setAnalytics] = useState<ListingAnalytics[]>(initialAnalytics)
  const [period, setPeriod] = useState<TimePeriod>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null) // null = use server default sort
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Unique categories from data (for filter dropdown)
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>()
    for (const row of analytics) {
      if (row.category_name) cats.add(row.category_name)
    }
    return Array.from(cats).sort()
  }, [analytics])

  // Filtered + sorted analytics
  const filteredAnalytics = useMemo(() => {
    let filtered = analytics

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((r) => r.category_name === categoryFilter)
    }

    // Status filter
    if (statusFilter === 'premium') {
      filtered = filtered.filter((r) => r.is_premium)
    } else if (statusFilter === 'basic') {
      filtered = filtered.filter((r) => !r.is_premium)
    }

    // Sort — if no explicit sort field, use server default (premium first → category → name)
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let cmp = 0
        switch (sortField) {
          case 'name':
            cmp = (a.name || '').localeCompare(b.name || '')
            break
          case 'category_name':
            cmp = (a.category_name || '').localeCompare(b.category_name || '')
            break
          case 'is_premium':
            cmp = (a.is_premium ? 1 : 0) - (b.is_premium ? 1 : 0)
            break
          case 'views':
            cmp = a.views - b.views
            break
          case 'cta_clicks':
            cmp = a.cta_clicks - b.cta_clicks
            break
        }
        return sortDir === 'desc' ? -cmp : cmp
      })
    }

    return filtered
  }, [analytics, sortField, sortDir, categoryFilter, statusFilter])

  // Summary stats (from filtered view)
  const totalViews = filteredAnalytics.reduce((sum, r) => sum + r.views, 0)
  const totalClicks = filteredAnalytics.reduce((sum, r) => sum + r.cta_clicks, 0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const handlePeriodChange = async (newPeriod: TimePeriod) => {
    setPeriod(newPeriod)
    if (newPeriod === 'custom') return // wait for user to set dates and submit

    setLoadingAnalytics(true)
    const { start, end } = getDateRange(newPeriod)
    const result = await getListingAnalyticsAction(start, end)
    setAnalytics(result)
    setLoadingAnalytics(false)
  }

  const handleCustomDateSubmit = async () => {
    if (!customStart || !customEnd) {
      toast.error('Please select both start and end dates')
      return
    }
    setLoadingAnalytics(true)
    const start = new Date(customStart + 'T00:00:00').toISOString()
    const end = new Date(customEnd + 'T23:59:59').toISOString()
    const result = await getListingAnalyticsAction(start, end)
    setAnalytics(result)
    setLoadingAnalytics(false)
  }

  const handleExportCsv = () => {
    const { start, end } = period === 'custom'
      ? { start: customStart || '2020-01-01', end: customEnd || new Date().toISOString().split('T')[0] }
      : getDateRange(period)

    const header = 'Listing,Category,Status,Views,CTA Clicks'
    const rows = filteredAnalytics.map((row) =>
      [
        `"${(row.name || '').replace(/"/g, '""')}"`,
        `"${(row.category_name || '').replace(/"/g, '""')}"`,
        row.is_premium ? 'Premium' : 'Basic',
        row.views,
        row.cta_clicks,
      ].join(',')
    )

    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `listing-analytics-${formatDateForFilename(start)}-to-${formatDateForFilename(end)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Ad management callbacks
  const handleEdit = (ad: AdWithStats) => {
    setEditAd(ad)
    setDialogOpen(true)
  }

  const handleDelete = (ad: AdWithStats) => {
    setDeleteAd(ad)
  }

  const handleCreateForSlot = (slot: AdSlot) => {
    setEditAd(null)
    setDefaultSlot(slot)
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

  const handleDuplicate = async (ad: AdWithStats) => {
    const result = await duplicateAdAction(ad.id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Ad duplicated')
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

  const premiumCount = filteredAnalytics.filter((l) => l.is_premium).length
  const basicCount = filteredAnalytics.length - premiumCount

  return (
    <>
      <Tabs defaultValue="ads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ads">Ad Management</TabsTrigger>
          <TabsTrigger value="analytics">Listing Analytics</TabsTrigger>
        </TabsList>

        {/* Ad Management Tab */}
        <TabsContent value="ads" className="space-y-6">
          {SLOTS.map((slot) => {
            const slotAds = ads.filter((ad) => ad.slot === slot)
            return (
              <Card key={slot}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">{AD_SLOT_LABELS[slot]}</CardTitle>
                    <CardDescription>{SLOT_DESCRIPTIONS[slot]}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => handleCreateForSlot(slot)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Ad
                  </Button>
                </CardHeader>
                <CardContent>
                  <AdTable
                    ads={slotAds}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onDuplicate={handleDuplicate}
                    hideSlotColumn
                  />
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* Listing Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Listing Analytics</CardTitle>
                  <CardDescription>
                    Page views and CTA clicks across all published listings
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <Download className="mr-1 h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Select value={period} onValueChange={(v) => handlePeriodChange(v as TimePeriod)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Tiers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                  </SelectContent>
                </Select>

                {period === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-[150px]"
                    />
                    <span className="text-sm text-slate-500">to</span>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-[150px]"
                    />
                    <Button size="sm" onClick={handleCustomDateSubmit}>
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {loadingAnalytics ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => handleSort('name')}>
                              Listing
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => handleSort('category_name')}>
                              Category
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead>
                            <Button variant="ghost" size="sm" className="h-8 -ml-3" onClick={() => handleSort('is_premium')}>
                              Status
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 -mr-3" onClick={() => handleSort('views')}>
                              Views
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 -mr-3" onClick={() => handleSort('cta_clicks')}>
                              CTA Clicks
                              <ArrowUpDown className="ml-1 h-3 w-3" />
                            </Button>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnalytics.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                              No published listings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAnalytics.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell className="font-medium">{row.name}</TableCell>
                              <TableCell className="text-slate-600">{row.category_name || '—'}</TableCell>
                              <TableCell>
                                {row.is_premium ? (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    Premium
                                  </Badge>
                                ) : (
                                  <span className="text-slate-500">Basic</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{row.views.toLocaleString()}</TableCell>
                              <TableCell className="text-right tabular-nums">{row.cta_clicks.toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <p className="text-sm text-slate-500 mt-3">
                    Showing {filteredAnalytics.length} listings ({premiumCount} premium, {basicCount} basic)
                    {totalViews > 0 || totalClicks > 0
                      ? ` — ${totalViews.toLocaleString()} views, ${totalClicks.toLocaleString()} clicks`
                      : ''}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        ad={editAd}
        defaultSlot={defaultSlot}
        sections={sections}
      />

      <DeleteAdDialog
        open={!!deleteAd}
        onClose={handleDeleteClose}
        ad={deleteAd}
      />
    </>
  )
}
