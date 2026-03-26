'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Listing } from '@/lib/queries/listings'
import { CategoryWithChildren } from '@/lib/queries/categories'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  categories: string[]  // Legacy categories for backward compat
  sectionCategories: CategoryWithChildren[]  // Hierarchical categories
  listingCategoryIds: Record<string, string[]>  // Listing ID -> category IDs
  onBulkDelete?: (rows: TData[]) => void
}

export function DataTable<TData extends Listing, TValue>({
  columns,
  data,
  categories,
  sectionCategories,
  listingCategoryIds,
  onBulkDelete,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    category: false, // Hide legacy category column (used only for filtering)
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<Set<string>>(() => {
    if (!categoryParam) return new Set()
    const match = sectionCategories.find(
      s => s.name.toLowerCase() === categoryParam.toLowerCase()
    )
    if (!match) return new Set()
    const ids = new Set<string>([match.id])
    for (const child of match.children || []) ids.add(child.id)
    return ids
  })
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set())

  // Filter data based on selected categories
  const filteredData = React.useMemo(() => {
    if (selectedCategoryIds.size === 0) return data

    return data.filter((listing) => {
      const listingCats = listingCategoryIds[listing.id] || []
      return listingCats.some(catId => selectedCategoryIds.has(catId))
    })
  }, [data, selectedCategoryIds, listingCategoryIds])

  const toggleCategory = (categoryId: string) => {
    // Check if this is a parent section
    const section = sectionCategories.find(s => s.id === categoryId)

    setSelectedCategoryIds(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
        // If parent, also deselect all children
        if (section?.children) {
          for (const child of section.children) {
            next.delete(child.id)
          }
        }
      } else {
        next.add(categoryId)
        // If parent, also select all children
        if (section?.children) {
          for (const child of section.children) {
            next.add(child.id)
          }
        }
      }
      return next
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const clearFilters = () => {
    setSelectedCategoryIds(new Set())
  }

  // Get selected category names for display
  const selectedNames = React.useMemo(() => {
    const names: string[] = []
    for (const section of sectionCategories) {
      if (selectedCategoryIds.has(section.id)) {
        names.push(section.name)
      }
      for (const sub of section.children || []) {
        if (selectedCategoryIds.has(sub.id)) {
          names.push(sub.name)
        }
      }
    }
    return names
  }, [selectedCategoryIds, sectionCategories])

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const listing = row.original
      const searchValue = filterValue.toLowerCase()
      return (
        listing.name?.toLowerCase().includes(searchValue) ||
        listing.address?.toLowerCase().includes(searchValue) ||
        false
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Input
            placeholder="Search listings..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Sections
                {selectedCategoryIds.size > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5">
                    {selectedCategoryIds.size}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-medium text-sm">Filter by Section</span>
                {selectedCategoryIds.size > 0 && (
                  <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto p-2">
                {sectionCategories.map((section) => (
                  <div key={section.id} className="mb-1">
                    <div className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-muted">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-0.5 hover:bg-muted-foreground/10 rounded"
                      >
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      <Checkbox
                        id={`section-${section.id}`}
                        checked={
                          section.children?.length > 0
                            ? section.children.every(c => selectedCategoryIds.has(c.id))
                              ? true
                              : section.children.some(c => selectedCategoryIds.has(c.id))
                                ? 'indeterminate'
                                : selectedCategoryIds.has(section.id)
                            : selectedCategoryIds.has(section.id)
                        }
                        onCheckedChange={() => toggleCategory(section.id)}
                      />
                      <label
                        htmlFor={`section-${section.id}`}
                        className="text-sm font-medium cursor-pointer flex-1"
                      >
                        {section.name}
                      </label>
                    </div>
                    {expandedSections.has(section.id) && section.children?.length > 0 && (
                      <div className="ml-8 space-y-1 pb-1">
                        {section.children.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted">
                            <Checkbox
                              id={`sub-${sub.id}`}
                              checked={selectedCategoryIds.has(sub.id)}
                              onCheckedChange={() => toggleCategory(sub.id)}
                            />
                            <label
                              htmlFor={`sub-${sub.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {sub.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedNames.slice(0, 3).map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))}
              {selectedNames.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedNames.length - 3} more
                </Badge>
              )}
            </div>
          )}
          <Select
            value={(table.getColumn('is_published')?.getFilterValue() as string) || 'all'}
            onValueChange={(value) =>
              table.getColumn('is_published')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn('is_premium')?.getFilterValue() as string) || 'all'}
            onValueChange={(value) =>
              table.getColumn('is_premium')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(table.getColumn('subscription_date')?.getFilterValue() as string) || 'all'}
            onValueChange={(value) =>
              table.getColumn('subscription_date')?.setFilterValue(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Renewals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Renewals</SelectItem>
              <SelectItem value="due_soon">Due Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedRows.length > 0 && onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onBulkDelete(selectedRows)}
          >
            Delete {selectedRows.length} selected
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No listings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              ←
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
