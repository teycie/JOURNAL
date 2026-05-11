'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveJournalEntry(
  userId: string,
  date: string,
  content: string,
  mood: string,
  entryId?: string,
  title?: string
) {
  const supabase = await createClient()

  try {
    let resolvedId = entryId
    if (!resolvedId) {
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .maybeSingle()
      if (existing) resolvedId = existing.id
    }

    const basePayload: any = {
      user_id: userId,
      entry_date: date,
      title: title || '',
      content,
      mood,
      updated_at: new Date().toISOString(),
    }
    if (resolvedId) basePayload.id = resolvedId

    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(basePayload)
      .select()
      .single()

    if (error) {
      return { success: false, message: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unexpected error' }
  }
}

// Add a new todo for a specific date, keyed by user_id + entry_date
export async function addTodo(
  userId: string,
  date: string,
  title: string,
  subtasks: string[]
) {
  const supabase = await createClient()

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.error('Invalid date format:', date)
    return { id: 'local-' + Date.now(), user_id: userId, entry_date: date, title, subtasks: [], completed: false }
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id: userId,
      entry_date: date,
      title,
      completed: false,
      subtasks: JSON.stringify(subtasks || []),
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to add todo for date', date, ':', error.message)
    // Return optimistic fallback for UI
    return {
      id: 'local-' + Date.now(),
      user_id: userId,
      entry_date: date,
      title,
      subtasks: [],
      completed: false,
    }
  }

  revalidatePath('/dashboard')
  return { ...data, subtasks: subtasks || [] }
}

export async function updateTodoStatus(id: string, completed: boolean) {
  const supabase = await createClient()
  if (id.startsWith('local-') || id.startsWith('temp-')) return
  const { error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function updateTodoTitle(id: string, title: string) {
  const supabase = await createClient()
  if (id.startsWith('local-') || id.startsWith('temp-')) return
  
  const { error } = await supabase
    .from('todos')
    .update({ title })
    .eq('id', id)

  if (error) {
    console.error('Failed to update todo title:', error.message)
  }
  
  revalidatePath('/dashboard')
}

export async function updateTodoSubtasks(
  id: string,
  subtasks: { text: string; done: boolean }[],
  completed: boolean
) {
  const supabase = await createClient()
  if (id.startsWith('local-') || id.startsWith('temp-')) return
  const { error } = await supabase
    .from('todos')
    .update({ subtasks: JSON.stringify(subtasks), completed })
    .eq('id', id)

  if (error) console.error('updateTodoSubtasks:', error.message)
  revalidatePath('/dashboard')
}

export async function deleteTodoAction(id: string) {
  const supabase = await createClient()
  if (id.startsWith('local-')) return
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function getMoodMap(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date, mood')
    .eq('user_id', userId)
    .not('mood', 'is', null)

  if (error) return {}

  const map: Record<string, string> = {}
  for (const row of data || []) {
    if (row.mood) map[row.entry_date] = row.mood
  }
  return map
}

// Fetch todos for a specific date, keyed by user_id and entry_date
export async function getTodosForDate(userId: string, date: string) {
  const supabase = await createClient()

  if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.error('Invalid date format for getTodosForDate:', date)
    return []
  }

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch todos for date', date, ':', error.message)
    return []
  }

  return data || []
}
