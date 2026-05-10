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
    const payload: any = {
      user_id: userId,
      entry_date: date,
      content,
      mood,
      title: title || '',
      updated_at: new Date().toISOString()
    }

    if (entryId) {
      payload.id = entryId
    } else {
      // Avoid duplicate entries for the same date by checking if one exists
      const { data: existing } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', date)
        .maybeSingle()
      
      if (existing) {
        payload.id = existing.id
      }
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .upsert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error saving journal entry:', error)
      return { success: false, message: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (err: any) {
    console.error('Unexpected error in saveJournalEntry:', err)
    return { success: false, message: err.message || 'An unexpected error occurred' }
  }
}

export async function addTodo(entryId: string | undefined, task: string, title?: string) {
  const supabase = await createClient()
  
  if (!entryId) {
    throw new Error("Please save your journal entry first before adding tasks.")
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({ entry_id: entryId, task, title: title || task })
    .select()
    .single()

  if (error) throw new Error(error.message)
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
