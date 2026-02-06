'use client'

import { TextBlockData } from '../block-editor'
import { RichTextEditor } from '../rich-text-editor'

interface TextBlockProps {
  data: TextBlockData
  onChange: (data: TextBlockData) => void
}

export function TextBlock({ data, onChange }: TextBlockProps) {
  return (
    <RichTextEditor
      value={data.content}
      onChange={(content) => onChange({ ...data, content })}
      placeholder="Enter your text..."
    />
  )
}
