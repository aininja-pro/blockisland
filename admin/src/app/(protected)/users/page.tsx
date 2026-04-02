import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './client'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const adminClient = createAdminClient()
  const serverClient = await createClient()

  const [{ data: { users } }, { data: { user: currentUser } }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    serverClient.auth.getUser(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Users
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage admin users for the dashboard
        </p>
      </div>

      <UsersClient
        users={(users || []).map((u) => ({
          id: u.id,
          email: u.email || '',
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at || null,
        }))}
        currentUserId={currentUser?.id || ''}
      />
    </div>
  )
}
