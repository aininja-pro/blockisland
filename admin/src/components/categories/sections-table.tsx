'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Star,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Trash2,
  Pencil,
  Plus,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import {
  deleteSection,
  deleteSubcategory,
  renameCategory,
  createSubcategory,
} from '@/app/(protected)/categories/actions'
import { toast } from 'sonner'
import type { SubcategoryStats } from '@/lib/queries/categories'

interface Section {
  id: string
  name: string
  totalCount: number
  premiumCount: number
  subcategoryCount: number
}

type SortKey = 'name' | 'totalCount' | 'premiumCount'
type SortDir = 'asc' | 'desc'

interface DeleteTarget {
  id: string
  name: string
  type: 'section' | 'subcategory'
  subcategoryCount?: number
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
    : <ArrowDown className="h-3.5 w-3.5 ml-1" />
}

function InlineEdit({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (text.trim() && text.trim() !== value) onSave(text.trim())
      else onCancel()
    }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <Input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (text.trim() && text.trim() !== value) onSave(text.trim())
        else onCancel()
      }}
      className="h-7 text-sm w-48"
    />
  )
}

function AddSubcategoryInput({ sectionId, onDone }: { sectionId: string; onDone: () => void }) {
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) { onDone(); return }
    setIsSaving(true)
    try {
      await createSubcategory(sectionId, name.trim())
      toast.success(`Added "${name.trim()}" subcategory`)
      onDone()
    } catch {
      toast.error('Failed to add subcategory')
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onDone()
  }

  return (
    <TableRow className="bg-muted/20">
      <TableCell className="pl-10 pr-4">
        <Input
          ref={inputRef}
          placeholder="Subcategory name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          disabled={isSaving}
          className="h-7 text-sm w-48"
        />
      </TableCell>
      <TableCell />
      <TableCell />
      <TableCell />
    </TableRow>
  )
}

interface SectionsTableProps {
  sections: Section[]
  subcategoriesBySection: Record<string, SubcategoryStats[]>
}

export function SectionsTable({ sections: initialSections, subcategoriesBySection }: SectionsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const sorted = [...initialSections].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
    return mul * (a[sortKey] - b[sortKey])
  })

  const totalListings = initialSections.reduce((sum, s) => sum + s.totalCount, 0)
  const totalPremium = initialSections.reduce((sum, s) => sum + s.premiumCount, 0)

  const toggleExpanded = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleRename = async (id: string, newName: string) => {
    setEditingId(null)
    try {
      await renameCategory(id, newName)
      toast.success('Renamed successfully')
    } catch {
      toast.error('Failed to rename')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.type === 'section') {
        await deleteSection(deleteTarget.id)
      } else {
        await deleteSubcategory(deleteTarget.id)
      }
      toast.success(`Deleted "${deleteTarget.name}"`)
    } catch {
      toast.error('Failed to delete')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <Card className="py-0 overflow-hidden">
        <Table>
          <colgroup>
            <col />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[180px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-4">
                <button onClick={() => handleSort('name')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                  Section
                  <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('totalCount')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  Listings
                  <SortIcon column="totalCount" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4">
                <button onClick={() => handleSort('premiumCount')} className="inline-flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors w-full justify-center">
                  Premium
                  <SortIcon column="premiumCount" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="px-4"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((section) => {
              const isExpanded = expandedSections.has(section.id)
              const subs = subcategoriesBySection[section.id] || []
              const hasChildren = section.subcategoryCount > 0

              return (
                <>{/* Section row */}
                  <TableRow key={section.id} className={isExpanded ? 'bg-muted/20' : undefined}>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpanded(section.id)}
                            className="p-0.5 rounded hover:bg-muted transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            }
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        {editingId === section.id ? (
                          <InlineEdit
                            value={section.name}
                            onSave={(v) => handleRename(section.id, v)}
                            onCancel={() => setEditingId(null)}
                          />
                        ) : (
                          <span
                            className="font-medium cursor-pointer"
                            onDoubleClick={() => setEditingId(section.id)}
                          >
                            {section.name}
                          </span>
                        )}
                        {hasChildren && !isExpanded && (
                          <span className="text-xs text-muted-foreground">
                            ({section.subcategoryCount})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center tabular-nums text-muted-foreground">
                      {section.totalCount}
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {section.premiumCount > 0 ? (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {section.premiumCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/listings?category=${encodeURIComponent(section.name)}`}>
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
                            <DropdownMenuItem onClick={() => setEditingId(section.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setExpandedSections(prev => new Set(prev).add(section.id))
                              setAddingSubTo(section.id)
                            }}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Subcategory
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({
                                id: section.id,
                                name: section.name,
                                type: 'section',
                                subcategoryCount: section.subcategoryCount,
                              })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Subcategory rows */}
                  {isExpanded && subs.map((sub) => (
                    <TableRow key={sub.id} className="bg-muted/10">
                      <TableCell className="pl-10 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-5" />
                          {editingId === sub.id ? (
                            <InlineEdit
                              value={sub.name}
                              onSave={(v) => handleRename(sub.id, v)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <span
                              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                              onDoubleClick={() => setEditingId(sub.id)}
                            >
                              {sub.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 text-center tabular-nums text-muted-foreground text-sm">
                        {sub.totalCount}
                      </TableCell>
                      <TableCell className="px-4 text-center">
                        {sub.premiumCount > 0 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {sub.premiumCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingId(sub.id)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({
                                id: sub.id,
                                name: sub.name,
                                type: 'subcategory',
                              })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Add subcategory input row */}
                  {isExpanded && addingSubTo === section.id && (
                    <AddSubcategoryInput
                      sectionId={section.id}
                      onDone={() => setAddingSubTo(null)}
                    />
                  )}

                  {/* Add subcategory button at bottom of expanded section */}
                  {isExpanded && addingSubTo !== section.id && (
                    <TableRow className="bg-muted/10 hover:bg-muted/20">
                      <TableCell className="pl-10 pr-4 py-1.5" colSpan={4}>
                        <button
                          onClick={() => setAddingSubTo(section.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add subcategory
                        </button>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="px-4 font-medium">Total</TableCell>
              <TableCell className="px-4 text-center tabular-nums font-medium">{totalListings}</TableCell>
              <TableCell className="px-4 text-center tabular-nums font-medium">{totalPremium}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'section' ? (
                <>
                  This will permanently delete this section
                  {deleteTarget.subcategoryCount && deleteTarget.subcategoryCount > 0 && ` and its ${deleteTarget.subcategoryCount} ${deleteTarget.subcategoryCount === 1 ? 'subcategory' : 'subcategories'}`}.
                  Listings will not be deleted but will lose their category assignment.
                </>
              ) : (
                <>
                  This will permanently delete this subcategory.
                  Listings will not be deleted but will lose this category assignment.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
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
