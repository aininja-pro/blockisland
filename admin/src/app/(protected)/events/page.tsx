import { getEvents } from '@/lib/queries/events'
import { EventsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Events
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage events for the Block Island app
          </p>
        </div>
      </div>

      <EventsClient events={events} />
    </div>
  )
}
