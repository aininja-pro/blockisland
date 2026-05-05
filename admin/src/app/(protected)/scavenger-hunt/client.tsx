'use client'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://blockisland.onrender.com'

export function ScavengerHuntClient() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <iframe
        title="Block Island Scavenger Hunt Chamber Admin"
        src={`${apiBaseUrl}/scavenger-hunt/chamber-admin`}
        className="h-[calc(100vh-13rem)] min-h-[720px] w-full bg-white"
      />
    </div>
  )
}
