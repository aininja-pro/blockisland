'use client'

import { Map, Marker } from 'pigeon-maps'

interface MapPreviewProps {
  latitude: number | null | undefined
  longitude: number | null | undefined
}

// Block Island center coordinates
const DEFAULT_CENTER: [number, number] = [41.1712, -71.5773]
const DEFAULT_ZOOM = 14

export function MapPreview({ latitude, longitude }: MapPreviewProps) {
  const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude)
  const center: [number, number] = hasCoords ? [latitude, longitude] : DEFAULT_CENTER

  return (
    <div className="rounded-lg overflow-hidden border">
      <Map
        height={200}
        center={center}
        zoom={hasCoords ? 15 : DEFAULT_ZOOM}
      >
        {hasCoords && <Marker width={36} anchor={[latitude, longitude]} />}
      </Map>
      {!hasCoords && (
        <p className="text-xs text-muted-foreground text-center py-1 bg-muted/50">
          Enter coordinates to see pin location
        </p>
      )}
    </div>
  )
}
