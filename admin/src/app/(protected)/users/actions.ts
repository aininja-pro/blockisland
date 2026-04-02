'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createUserAction(email: string, password: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUserAction(userId: string) {
  const supabase = createAdminClient()

  // Prevent deleting yourself
  const serverClient = await createClient()
  const { data: { user: currentUser } } = await serverClient.auth.getUser()
  if (currentUser?.id === userId) {
    return { error: 'You cannot delete your own account' }
  }

  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function changePasswordAction(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
