'use client'

import { useState } from 'react'
import { Code, Eye, EyeOff } from 'lucide-react'
import { EmbedBlockData } from '../block-editor'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface EmbedBlockProps {
  data: EmbedBlockData
  onChange: (data: EmbedBlockData) => void
}

export function EmbedBlock({ data, onChange }: EmbedBlockProps) {
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">
          Source URL (optional, for reference)
        </Label>
        <Input
          placeholder="https://..."
          value={data.url || ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm text-muted-foreground">
            Embed HTML Code
          </Label>
          {data.html && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="h-7 text-xs"
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" /> Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" /> Show Preview
                </>
              )}
            </Button>
          )}
        </div>
        <Textarea
          placeholder="Paste embed code here (e.g., <iframe>...</iframe>)"
          value={data.html}
          onChange={(e) => onChange({ ...data, html: e.target.value })}
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      {showPreview && data.html && (
        <div className="border rounded-md p-4">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Eye className="h-3 w-3" /> Preview
          </div>
          <div
            className="[&>iframe]:max-w-full"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        </div>
      )}

      {!data.html && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <Code className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Paste embed code from Instagram, Twitter, maps, or other services
          </p>
        </div>
      )}
    </div>
  )
}
