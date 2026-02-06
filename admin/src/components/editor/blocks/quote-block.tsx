'use client'

import { QuoteBlockData } from '../block-editor'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface QuoteBlockProps {
  data: QuoteBlockData
  onChange: (data: QuoteBlockData) => void
}

export function QuoteBlock({ data, onChange }: QuoteBlockProps) {
  return (
    <div className="space-y-3">
      <div className="border-l-4 border-primary pl-4">
        <Textarea
          placeholder="Enter the quote text..."
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          className="min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 text-lg italic"
        />
      </div>
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">
          Attribution (optional)
        </Label>
        <Input
          placeholder="— Author name"
          value={data.attribution || ''}
          onChange={(e) => onChange({ ...data, attribution: e.target.value })}
        />
      </div>
    </div>
  )
}
