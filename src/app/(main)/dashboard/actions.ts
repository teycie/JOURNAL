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
    // Resolve existing entry ID for this date if not provided
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
      content,
      mood,
      updated_at: new Date().toISOString(),
    }
    if (resolvedId) basePayload.id = resolvedId

    // Try with title first
    const { data, error } = await supabase
      .from('journal_entries')
      .upsert({ ...basePayload, title: title || '' })
      .select()
      .single()

    if (error) {
      // If title column doesn't exist yet, retry without it
      const missingColumn =
        error.message?.toLowerCase().includes('title') ||
        error.code === 'PGRST204' ||
        error.message?.toLowerCase().includes('schema cache')

      if (missingColumn) {
        console.warn(
          '[actions] title column missing in journal_entries — retrying without it. ' +
          'Run migration_add_titles.sql in your Supabase SQL editor to fix permanently.'
        )
        const { data: data2, error: error2 } = await supabase
          .from('journal_entries')
          .upsert(basePayload)
          .select()
          .single()

        if (error2) {
          console.error('saveJournalEntry fallback error:', error2)
          return { success: false, message: error2.message }
        }

        revalidatePath('/dashboard')
        return { success: true, data: data2 }
      }

      console.error('saveJournalEntry error:', error)
      return { success: false, message: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    console.error('saveJournalEntry unexpected error:', err)
    return { success: false, message: err.message || 'Unexpected error' }
  }
}

export async function addTodo(entryId: string | undefined, task: string, title?: string) {
  const supabase = await createClient()

  if (!entryId) {
    throw new Error('Please save your journal entry first before adding tasks.')
  }

  // Try with title first
  const { data, error } = await supabase
    .from('todos')
    .insert({ entry_id: entryId, task, title: title || task })
    .select()
    .single()

  if (error) {
    const missingColumn =
      error.message?.toLowerCase().includes('title') ||
      error.code === 'PGRST204' ||
      error.message?.toLowerCase().includes('schema cache')

    if (missingColumn) {
      console.warn(
        '[actions] title column missing in todos — retrying without it. ' +
        'Run migration_add_titles.sql in your Supabase SQL editor.'
      )
      const { data: data2, error: error2 } = await supabase
        .from('todos')
        .insert({ entry_id: entryId, task })
        .select()
        .single()

      if (error2) throw new Error(error2.message)
      revalidatePath('/dashboard')
      // Merge title client-side so the UI shows it correctly
      return { ...data2, title: title || task }
    }

    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  return data
}

export async function updateTodoStatus(id: string, completed: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('todos')
    .update({ completed })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
}

export async function deleteTodoAction(id: string) {
  const supabase = await createClient()
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
