'use client'

import { useState, useCallback } from 'react'
import { Video, ExternalLink } from 'lucide-react'
import { VideoBlockData } from '../block-editor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VideoBlockProps {
  data: VideoBlockData
  onChange: (data: VideoBlockData) => void
}

function getVideoProvider(url: string): 'youtube' | 'vimeo' | 'other' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

function getVideoEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
}

export function VideoBlock({ data, onChange }: VideoBlockProps) {
  const [inputValue, setInputValue] = useState(data.url)

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setInputValue(url)
    const provider = getVideoProvider(url)
    onChange({ ...data, url, provider })
  }, [data, onChange])

  const embedUrl = getVideoEmbedUrl(data.url)

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">
          Paste a YouTube or Vimeo URL
        </Label>
        <Input
          placeholder="https://www.youtube.com/watch?v=..."
          value={inputValue}
          onChange={handleUrlChange}
        />
      </div>

      {embedUrl ? (
        <div className="relative aspect-video rounded-md overflow-hidden bg-black">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : data.url ? (
        <div className="border rounded-md p-4 text-center text-muted-foreground">
          <Video className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Video URL not recognized</p>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm flex items-center justify-center gap-1 mt-2 hover:underline"
          >
            Open link <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Enter a video URL above to embed</p>
        </div>
      )}
    </div>
  )
}
