'use client'

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { AdWithStats } from '@/lib/queries/ads'

interface AdTableProps {
  ads: AdWithStats[]
  onEdit: (ad: AdWithStats) => void
  onDelete: (ad: AdWithStats) => void
  onToggleActive: (adId: string, isActive: boolean) => Promise<void>
}

export function AdTable({ ads, onEdit, onDelete, onToggleActive }: AdTableProps) {
  if (ads.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No ads yet. Click "Add Ad" to create your first banner ad.
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
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24 text-right">Impressions</TableHead>
            <TableHead className="w-20 text-right">Clicks</TableHead>
            <TableHead className="w-20 text-right">CTR</TableHead>
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
              <TableCell className="font-medium">{ad.title}</TableCell>
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
