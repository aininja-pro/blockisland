'use client'

import { Copy, ExternalLink, Link, MoreHorizontal, Pencil, Trash2, AlertTriangle, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type AdWithStats, AD_SLOT_LABELS, type AdSlot } from '@/lib/queries/ad-types'

function formatLastServed(lastServedAt: string | null): string {
  if (!lastServedAt) return 'Never'
  const diff = Date.now() - new Date(lastServedAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AdTableProps {
  ads: AdWithStats[]
  onEdit: (ad: AdWithStats) => void
  onDelete: (ad: AdWithStats) => void
  onToggleActive: (adId: string, isActive: boolean) => Promise<void>
  onDuplicate: (ad: AdWithStats) => void
  onResetStats: (ad: AdWithStats) => void
  hideSlotColumn?: boolean
}

export function AdTable({ ads, onEdit, onDelete, onToggleActive, onDuplicate, onResetStats, hideSlotColumn }: AdTableProps) {
  if (ads.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No ads in this slot yet.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Image</TableHead>
            <TableHead>Title</TableHead>
            {!hideSlotColumn && <TableHead className="w-28">Slot</TableHead>}
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24 text-right">Impressions</TableHead>
            <TableHead className="w-20 text-right">Clicks</TableHead>
            <TableHead className="w-20 text-right">CTR</TableHead>
            <TableHead className="w-28">Last Served</TableHead>
            <TableHead className="w-32">Schedule</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell>
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="h-10 w-16 object-cover rounded"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ad.title}</span>
                  {ad.link_type === 'internal' ? (
                    ad.linked_listing_id ? (
                      <Link className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        Deleted
                      </span>
                    )
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              </TableCell>
              {!hideSlotColumn && (
                <TableCell>
                  <Badge variant="outline">
                    {AD_SLOT_LABELS[ad.slot as AdSlot] || ad.slot}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={(checked) => onToggleActive(ad.id, checked)}
                  />
                  <Badge variant={ad.is_active ? 'default' : 'secondary'}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">{ad.impressions.toLocaleString()}</TableCell>
              <TableCell className="text-right">{ad.clicks.toLocaleString()}</TableCell>
              <TableCell className="text-right">{ad.ctr.toFixed(1)}%</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatLastServed(ad.last_served_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {ad.start_date || ad.end_date ? (
                  <>
                    {ad.start_date || 'Any'} &ndash; {ad.end_date || 'Any'}
                  </>
                ) : (
                  'Always'
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(ad)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(ad)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetStats(ad)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Stats
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(ad)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
