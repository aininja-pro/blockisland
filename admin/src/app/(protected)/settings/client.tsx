'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateRotationSettingAction } from './actions'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://blockisland.onrender.com'
const ROTATION_OPTIONS = [4, 8, 12, 24] as const

interface SectionWithSubs {
  id: string
  name: string
  subcategories: { id: string; name: string }[]
}

interface SettingsClientProps {
  sections: SectionWithSubs[]
  rotationHours: number
}

export function SettingsClient({ sections, rotationHours: initialHours }: SettingsClientProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedHours, setSelectedHours] = useState(initialHours)
  const [saving, setSaving] = useState(false)

  const toggleExpanded = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const handleCopy = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSaveRotation = async () => {
    setSaving(true)
    const result = await updateRotationSettingAction(selectedHours)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Saved — rotation set to ${selectedHours} hours`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Feed URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Feed URLs</CardTitle>
          <CardDescription>
            GoodBarber feed URLs for each section. Copy and paste into GoodBarber section settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Feed URL</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((section) => {
                  const encodedSection = encodeURIComponent(section.name)
                  const sectionUrl = `${API_BASE}/api/feed/maps?section=${encodedSection}`
                  const isExpanded = expandedSections.has(section.id)
                  const hasSubs = section.subcategories.length > 0

                  return (
                    <>
                      <TableRow key={section.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {hasSubs ? (
                              <button
                                onClick={() => toggleExpanded(section.id)}
                                className="p-0.5 hover:bg-slate-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                )}
                              </button>
                            ) : (
                              <span className="w-5" />
                            )}
                            {section.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 font-mono break-all">
                          {sectionUrl}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(sectionUrl, section.id)}
                          >
                            {copiedId === section.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && section.subcategories.map((sub) => {
                        const subUrl = `${API_BASE}/api/feed/maps?section=${encodedSection}&subcategory=${encodeURIComponent(sub.name)}`
                        const subCopyId = `${section.id}-${sub.id}`
                        return (
                          <TableRow key={subCopyId} className="bg-slate-50">
                            <TableCell className="font-medium text-slate-600">
                              <div className="pl-8">{sub.name}</div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-400 font-mono break-all">
                              {subUrl}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleCopy(subUrl, subCopyId)}
                              >
                                {copiedId === subCopyId ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Events Feed URL */}
      <Card>
        <CardHeader>
          <CardTitle>Events Feed URL</CardTitle>
          <CardDescription>
            GoodBarber feed URL for the Events section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="text-sm text-slate-500 font-mono break-all flex-1">
              {API_BASE}/api/feed/events
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={async () => {
                await navigator.clipboard.writeText(`${API_BASE}/api/feed/events`)
                setCopiedId('events')
                toast.success('Copied!')
                setTimeout(() => setCopiedId(null), 2000)
              }}
            >
              {copiedId === 'events' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rotation Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Rotation Frequency</CardTitle>
          <CardDescription>
            How often premium listings rotate position within their section.
            Currently rotating every {initialHours} hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {ROTATION_OPTIONS.map((hours) => (
              <Button
                key={hours}
                variant={selectedHours === hours ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedHours(hours)}
              >
                {hours}h
              </Button>
            ))}

            <Button
              size="sm"
              className="ml-4"
              onClick={handleSaveRotation}
              disabled={saving || selectedHours === initialHours}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
