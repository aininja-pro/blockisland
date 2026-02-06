'use client'

import { useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TextBlock } from './blocks/text-block'
import { PhotoBlock } from './blocks/photo-block'
import { VideoBlock } from './blocks/video-block'
import { QuoteBlock } from './blocks/quote-block'
import { EmbedBlock } from './blocks/embed-block'
import { Type, Camera, Video, Quote, Code } from 'lucide-react'

export type ContentBlockType = 'text' | 'photo' | 'video' | 'quote' | 'embed'

export interface TextBlockData {
  type: 'text'
  content: string
}

export interface PhotoBlockData {
  type: 'photo'
  url: string
  caption?: string
  isLocationThumbnail?: boolean
}

export interface VideoBlockData {
  type: 'video'
  url: string
  provider?: 'youtube' | 'vimeo' | 'other'
}

export interface QuoteBlockData {
  type: 'quote'
  text: string
  attribution?: string
}

export interface EmbedBlockData {
  type: 'embed'
  html: string
  url?: string
}

export type ContentBlock = TextBlockData | PhotoBlockData | VideoBlockData | QuoteBlockData | EmbedBlockData

interface BlockEditorProps {
  value: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

const BLOCK_TYPES: { type: ContentBlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Text', icon: <Type className="h-5 w-5" /> },
  { type: 'photo', label: 'Photos', icon: <Camera className="h-5 w-5" /> },
  { type: 'video', label: 'Video', icon: <Video className="h-5 w-5" /> },
  { type: 'quote', label: 'Quote', icon: <Quote className="h-5 w-5" /> },
  { type: 'embed', label: 'Embed', icon: <Code className="h-5 w-5" /> },
]

function createEmptyBlock(type: ContentBlockType): ContentBlock {
  switch (type) {
    case 'text':
      return { type: 'text', content: '' }
    case 'photo':
      return { type: 'photo', url: '', caption: '', isLocationThumbnail: false }
    case 'video':
      return { type: 'video', url: '', provider: 'youtube' }
    case 'quote':
      return { type: 'quote', text: '', attribution: '' }
    case 'embed':
      return { type: 'embed', html: '', url: '' }
  }
}

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const addBlock = useCallback((type: ContentBlockType) => {
    const newBlock = createEmptyBlock(type)
    onChange([...value, newBlock])
    setPopoverOpen(false)
  }, [value, onChange])

  const updateBlock = useCallback((index: number, updatedBlock: ContentBlock) => {
    const newBlocks = [...value]
    newBlocks[index] = updatedBlock
    onChange(newBlocks)
  }, [value, onChange])

  const removeBlock = useCallback((index: number) => {
    const newBlocks = value.filter((_, i) => i !== index)
    onChange(newBlocks)
  }, [value, onChange])

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= value.length) return

    const newBlocks = [...value]
    const [removed] = newBlocks.splice(index, 1)
    newBlocks.splice(newIndex, 0, removed)
    onChange(newBlocks)
  }, [value, onChange])

  return (
    <div className="space-y-4">
      {/* Add Element Button */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="default"
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 h-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add an element
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-zinc-900 border-zinc-800" align="start">
          <div className="grid grid-cols-3 gap-1">
            {BLOCK_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => addBlock(type)}
                className="flex flex-col items-center justify-center p-3 rounded-md hover:bg-zinc-800 text-white transition-colors min-w-[70px]"
              >
                {icon}
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Block List */}
      <div className="space-y-4">
        {value.map((block, index) => (
          <BlockWrapper
            key={index}
            index={index}
            totalBlocks={value.length}
            onDelete={() => removeBlock(index)}
            onMoveUp={() => moveBlock(index, 'up')}
            onMoveDown={() => moveBlock(index, 'down')}
          >
            {block.type === 'text' && (
              <TextBlock
                data={block}
                onChange={(data) => updateBlock(index, data)}
              />
            )}
            {block.type === 'photo' && (
              <PhotoBlock
                data={block}
                onChange={(data) => updateBlock(index, data)}
              />
            )}
            {block.type === 'video' && (
              <VideoBlock
                data={block}
                onChange={(data) => updateBlock(index, data)}
              />
            )}
            {block.type === 'quote' && (
              <QuoteBlock
                data={block}
                onChange={(data) => updateBlock(index, data)}
              />
            )}
            {block.type === 'embed' && (
              <EmbedBlock
                data={block}
                onChange={(data) => updateBlock(index, data)}
              />
            )}
          </BlockWrapper>
        ))}
      </div>

      {value.length === 0 && (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
          Click "Add an element" to start building your content
        </div>
      )}
    </div>
  )
}

interface BlockWrapperProps {
  children: React.ReactNode
  index: number
  totalBlocks: number
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function BlockWrapper({ children, index, totalBlocks, onDelete, onMoveUp, onMoveDown }: BlockWrapperProps) {
  return (
    <div className="group relative border rounded-lg bg-card">
      {/* Block Controls */}
      <div className="absolute -right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        {index > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 shadow-sm"
            onClick={onMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
        {index < totalBlocks - 1 && (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-7 w-7 shadow-sm"
            onClick={onMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-7 w-7 shadow-sm"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Block Content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// Utility function to convert blocks to HTML for storage/API
export function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return block.content
      case 'photo':
        let imgHtml = `<figure class="content-photo">`
        imgHtml += `<img src="${block.url}" alt="${block.caption || ''}" />`
        if (block.caption) {
          imgHtml += `<figcaption>${block.caption}</figcaption>`
        }
        imgHtml += `</figure>`
        return imgHtml
      case 'video':
        return `<div class="content-video" data-url="${block.url}">${getVideoEmbed(block.url)}</div>`
      case 'quote':
        let quoteHtml = `<blockquote class="content-quote">`
        quoteHtml += `<p>${block.text}</p>`
        if (block.attribution) {
          quoteHtml += `<cite>${block.attribution}</cite>`
        }
        quoteHtml += `</blockquote>`
        return quoteHtml
      case 'embed':
        return `<div class="content-embed">${block.html}</div>`
      default:
        return ''
    }
  }).join('\n')
}

function getVideoEmbed(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe>`
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`
  }

  return `<a href="${url}">${url}</a>`
}
