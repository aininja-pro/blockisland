import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
        Welcome to Block Island Admin
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Signed in as: {user?.email}
      </p>
    </div>
  )
}
