'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, X, Upload, Loader2 } from 'lucide-react'
import { CategoryWithChildren } from '@/lib/queries/categories'
import { BulkListingData, bulkCreateListingsAction } from './actions'

interface ImportClientProps {
  categories: CategoryWithChildren[]
}

export function ImportClient({ categories }: ImportClientProps) {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<BulkListingData[] | null>(null)
  const [importing, setImporting] = useState(false)

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handleParse() {
    const lines = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length === 0) {
      toast.error('No data to parse. Paste tab-separated rows first.')
      return
    }

    const listings: BulkListingData[] = lines.map((line) => {
      const cols = line.split('\t')
      return {
        name: cols[0]?.trim() || '',
        address: cols[1]?.trim() || '',
        phone: cols[2]?.trim() || '',
        email: cols[3]?.trim() || '',
        website: cols[4]?.trim() || '',
        image_url: cols[5]?.trim() || '',
      }
    })

    const invalid = listings.filter((l) => !l.name)
    if (invalid.length > 0) {
      toast.error(`${invalid.length} row(s) are missing a name (first column).`)
      return
    }

    setParsed(listings)
  }

  function removeRow(index: number) {
    setParsed((prev) => prev ? prev.filter((_, i) => i !== index) : null)
  }

  async function handleImport() {
    if (!parsed || parsed.length === 0) return

    if (selectedCategoryIds.length === 0) {
      toast.error('Select at least one category before importing.')
      return
    }

    setImporting(true)
    try {
      const result = await bulkCreateListingsAction(parsed, selectedCategoryIds)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`${result.count} listing${result.count === 1 ? '' : 's'} created`)
        setParsed(null)
        setRawText('')
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setImporting(false)
    }
  }

  const query = categorySearch.toLowerCase()
  const filteredCategories = query
    ? categories.filter(
        (section) =>
          section.name.toLowerCase().includes(query) ||
          section.children.some((child) => child.name.toLowerCase().includes(query))
      )
    : categories

  return (
    <div className="space-y-6">
      {/* Category Selector */}
      <div>
        <h3 className="text-sm font-medium mb-2">Assign to Categories *</h3>
        <p className="text-sm text-muted-foreground mb-2">
          All imported listings will be linked to these categories.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <div className="relative border-b">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-3 space-y-1">
            {filteredCategories.map((section) => {
              const matchingChildren = query
                ? section.children.filter(
                    (child) =>
                      child.name.toLowerCase().includes(query) ||
                      section.name.toLowerCase().includes(query)
                  )
                : section.children

              return (
                <div key={section.id} className="space-y-1">
                  <div className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`import-${section.id}`}
                      checked={selectedCategoryIds.includes(section.id)}
                      onCheckedChange={() => toggleCategory(section.id)}
                      className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                    />
                    <label
                      htmlFor={`import-${section.id}`}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {section.name}
                    </label>
                  </div>
                  {matchingChildren.map((child) => (
                    <div key={child.id} className="flex items-center space-x-2 pl-6 py-0.5">
                      <Checkbox
                        id={`import-${child.id}`}
                        checked={selectedCategoryIds.includes(child.id)}
                        onCheckedChange={() => toggleCategory(child.id)}
                        className="data-[state=checked]:bg-blue-700 data-[state=checked]:border-blue-700"
                      />
                      <label
                        htmlFor={`import-${child.id}`}
                        className="text-sm font-normal cursor-pointer text-muted-foreground"
                      >
                        {child.name}
                      </label>
                    </div>
                  ))}
                </div>
              )
            })}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories match &quot;{categorySearch}&quot;
              </p>
            )}
          </div>
        </div>
        {selectedCategoryIds.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCategoryIds.length} selected
          </p>
        )}
      </div>

      {/* Paste Area */}
      <div>
        <h3 className="text-sm font-medium mb-2">Paste Listings</h3>
        <p className="text-sm text-muted-foreground mb-2">
          One listing per line, tab-separated columns: <span className="font-mono text-xs">Name &#9; Address &#9; Phone &#9; Email &#9; Website &#9; Image URL</span>
        </p>
        <Textarea
          placeholder={"Block Island Hi-Speed Ferry\t304 Great Island Rd, Galilee, RI\t401-783-7996\tinfo@example.com\thttps://bihsferry.com\thttps://example.com/image.jpg"}
          rows={8}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            setParsed(null)
          }}
          className="font-mono text-xs"
        />
        <div className="flex justify-end mt-2">
          <Button onClick={handleParse} disabled={!rawText.trim()}>
            Parse
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      {parsed && parsed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">
              Preview ({parsed.length} listing{parsed.length === 1 ? '' : 's'})
            </h3>
            <Button
              onClick={handleImport}
              disabled={importing || selectedCategoryIds.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Import All
                </>
              )}
            </Button>
          </div>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Image URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <button
                        onClick={() => removeRow(i)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-sm">{row.address}</TableCell>
                    <TableCell className="text-sm">{row.phone}</TableCell>
                    <TableCell className="text-sm">{row.email}</TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{row.website}</TableCell>
                    <TableCell className="text-sm max-w-48 truncate">{row.image_url}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
