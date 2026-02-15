'use client'

import { useRef, useCallback, useState } from 'react'
import { Upload, X, Link } from 'lucide-react'
import { PhotoBlockData } from '../block-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface PhotoBlockProps {
  data: PhotoBlockData
  onChange: (data: PhotoBlockData) => void
}

export function PhotoBlock({ data, onChange }: PhotoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const { url } = await response.json()
      onChange({ ...data, url })
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }, [data, onChange])

  const removeImage = useCallback(() => {
    onChange({ ...data, url: '' })
  }, [data, onChange])

  return (
    <div className="space-y-3">
      {data.url ? (
        <div className="relative group/image">
          <img
            src={data.url}
            alt={data.caption || 'Uploaded image'}
            className="max-w-full h-auto rounded-md mx-auto"
          />
          {/* Location Thumbnail Badge */}
          {data.isLocationThumbnail && (
            <div className="absolute top-2 right-12 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
              Location thumbnail
            </div>
          )}
          {/* Remove Button */}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover/image:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span>Click to upload an image</span>
                <span className="text-xs">JPEG, PNG, GIF, or WebP (max 5MB)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <div className="flex-1 border-t" />
            <span>or paste a URL</span>
            <div className="flex-1 border-t" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (urlInput.trim()) {
                    onChange({ ...data, url: urlInput.trim() })
                    setUrlInput('')
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!urlInput.trim()}
              onClick={() => {
                onChange({ ...data, url: urlInput.trim() })
                setUrlInput('')
              }}
            >
              <Link className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Caption Input */}
      <Input
        placeholder="Add a caption (optional)"
        value={data.caption || ''}
        onChange={(e) => onChange({ ...data, caption: e.target.value })}
      />

      {/* Location Thumbnail Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`thumbnail-${Math.random()}`}
          checked={data.isLocationThumbnail || false}
          onCheckedChange={(checked) => onChange({ ...data, isLocationThumbnail: !!checked })}
        />
        <Label htmlFor={`thumbnail-${Math.random()}`} className="text-sm cursor-pointer">
          Use as location thumbnail
        </Label>
      </div>
    </div>
  )
}
