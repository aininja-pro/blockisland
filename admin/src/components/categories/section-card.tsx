'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableRow, TableCell } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Star, ArrowRight, MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteSection } from '@/app/(protected)/categories/actions'
import { toast } from 'sonner'

interface SectionCardProps {
  id: string
  name: string
  totalCount: number
  premiumCount: number
  subcategoryCount: number
}

export function SectionCard({
  id,
  name,
  totalCount,
  premiumCount,
  subcategoryCount,
}: SectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteSection(id)
      toast.success(`Deleted "${name}" section`)
    } catch {
      toast.error('Failed to delete section')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <TableRow>
        <TableCell className="px-4">
          <div>
            <span className="font-medium">{name}</span>
            {subcategoryCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell className="pl-8 pr-10 text-right tabular-nums text-muted-foreground">
          {totalCount}
        </TableCell>
        <TableCell className="pl-10 pr-8 text-center">
          {premiumCount > 0 ? (
            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
              <Star className="h-3 w-3 mr-1" />
              {premiumCount}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/listings?category=${encodeURIComponent(name)}`}>
                View Listings
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this section
              {subcategoryCount > 0 && ` and its ${subcategoryCount} ${subcategoryCount === 1 ? 'subcategory' : 'subcategories'}`}.
              Listings will not be deleted but will lose their category assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
