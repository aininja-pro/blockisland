export type AdSlot = 'top_banner' | 'middle_block' | 'bottom_block'
export type AdLinkType = 'external' | 'internal'

export const AD_SLOT_LABELS: Record<AdSlot, string> = {
  top_banner: 'Top Banner',
  middle_block: 'Middle Block',
  bottom_block: 'Bottom Block',
}

export interface Ad {
  id: string
  title: string
  slot: AdSlot
  image_url: string
  destination_url: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  link_type: AdLinkType
  linked_listing_id: string | null
  last_served_at: string | null
  created_at: string
  updated_at: string
}

export interface AdStats {
  ad_id: string
  impressions: number
  clicks: number
  ctr: number
}

export interface AdWithStats extends Ad {
  impressions: number
  clicks: number
  ctr: number
}
