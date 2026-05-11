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

// Todos are now linked to (user_id, entry_date) — independent of diary saves
export async function addTodo(
  userId: string,
  date: string,
  title: string,
  subtasks: string[]
) {
  const supabase = await createClient()

  // Try with title + subtasks columns
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, entry_date: date, title, subtasks: JSON.stringify(subtasks) })
    .select()
    .single()

  if (error) {
    // Fallback 1: try without subtasks if column missing
    const { data: data2, error: error2 } = await supabase
      .from('todos')
      .insert({ user_id: userId, entry_date: date, title })
      .select()
      .single()

    if (error2) {
      // Final fallback: old schema with entry_id
      // First ensure a journal entry exists for this date so we can link to it
      let { data: entry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .maybeSingle()

      if (!entry) {
        const { data: newEntry } = await supabase
          .from('journal_entries')
          .insert({ user_id: userId, entry_date: date, content: '', mood: '' })
          .select('id')
          .single()
        entry = newEntry
      }

      if (entry) {
        const { data: data3, error: error3 } = await supabase
          .from('todos')
          .insert({ entry_id: entry.id, task: title }) // strictly only use entry_id and task
          .select()
          .single()
          
        if (data3) {
          revalidatePath('/dashboard')
          return { ...data3, subtasks: subtasks, completed: false, title }
        }
        console.error('Final fallback error:', error3)
      }

      // If all database inserts fail, return local fallback so UI doesn't crash
      return { id: 'local-' + Date.now(), user_id: userId, entry_date: date, title, subtasks: [], completed: false }
    }

    revalidatePath('/dashboard')
    return { ...data2, subtasks: subtasks, completed: false }
  }

  revalidatePath('/dashboard')
  return { ...data, subtasks: subtasks }
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
    const { error: error2 } = await supabase
      .from('todos')
      .update({ task: title })
      .eq('id', id)
    if (error2) throw new Error(error2.message)
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

// Fetch todos for a specific date (independent of diary entry)
export async function getTodosForDate(userId: string, date: string) {
  const supabase = await createClient()

  // Try new schema first (user_id + entry_date on todos)
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .order('created_at', { ascending: true })

  if (!error && data) return data

  // Fallback: fetch via journal_entries join (old schema)
  const { data: entry } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('entry_date', date)
    .maybeSingle()

  if (!entry) return []

  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('entry_id', entry.id)
    .order('created_at', { ascending: true })

  return todos || []
}
