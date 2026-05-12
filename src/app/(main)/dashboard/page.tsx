import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import DashboardClient from './DashboardClient'
import { getMoodMap, getTodosForDate } from './actions'

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
  
  // Format the date for display (e.g., Monday, May 12th)
  const displayDate = format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMMM do')

  // Fetch diary entry for selected date
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('entry_date', selectedDate)
    .maybeSingle()

  // Fetch todos independently by date (not tied to diary save)
  const todos = await getTodosForDate(user.id, selectedDate)

  // Mood map for calendar emoji display
  const moodMap = await getMoodMap(user.id)

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Good day.</h1>
        <p className="text-gray-500 mt-1">It&apos;s {displayDate}. Let&apos;s reflect on your moments.</p>
      </header>
      
      <DashboardClient 
        initialEntry={entry ?? null} 
        initialTodos={todos} 
        userId={user.id}
        moodMap={moodMap}
      />
    </div>
  )
}
