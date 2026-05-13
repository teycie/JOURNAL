import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const fullName = user.user_metadata?.full_name || ''

  return <ProfileClient userEmail={user.email ?? ''} initialName={fullName} />
}
