import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import { getMoodMap } from './actions'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const selectedDate = params.date || new Date().toISOString().split('T')[0]

  // Fetch entry for the selected date
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', selectedDate)
    .single()

  // Fetch todos for the selected entry (if it exists)
  let todos: any[] = []
  if (entry) {
    const { data: fetchedTodos } = await supabase
      .from('todos')
      .select('*')
      .eq('entry_id', entry.id)
      .order('created_at', { ascending: true })
    if (fetchedTodos) todos = fetchedTodos
  }

  // Fetch all mood entries for the calendar emoji display
  const moodMap = await getMoodMap(user.id)

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Good day.</h1>
        <p className="text-gray-500 mt-1">Let&apos;s reflect on your moments.</p>
      </header>
      
      <DashboardClient 
        initialEntry={entry} 
        initialTodos={todos} 
        userId={user.id}
        moodMap={moodMap}
      />
    </div>
  )
}
