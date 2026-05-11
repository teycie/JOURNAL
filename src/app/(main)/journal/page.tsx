import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import JournalClient from './JournalClient'

export default async function JournalPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const parsePages = (value: unknown) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }

  let books: any[] = []
  try {
    const { data } = await supabase
      .from('books')
      .select('id, title, cover_color, cover_url, cover_meta, pages, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    books = data || []
  } catch {
    const { data } = await supabase
      .from('books')
      .select('id, title, cover_url, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    books = data || []
  }

  const initialBooks = (books || []).map(book => {
    const coverMeta = (book.cover_meta && typeof book.cover_meta === 'object') ? book.cover_meta as Record<string, unknown> : {}
    const pages = parsePages(book.pages).length > 0
      ? parsePages(book.pages)
      : parsePages(coverMeta.pages).length > 0
        ? parsePages(coverMeta.pages)
        : [{ images: [], texts: [] }, { images: [], texts: [] }]

    return {
      id: book.id,
      title: book.title,
      coverColor: book.cover_color || 'bg-gradient-to-br from-violet-200 to-purple-300',
      coverImage: book.cover_url || undefined,
      coverImageOffset: (coverMeta.coverImageOffset as { x: number; y: number } | undefined) || { x: 0, y: 0 },
      titlePos: (coverMeta.titlePos as { x: number; y: number } | undefined) || { x: 50, y: 50 },
      titleFontSize: (coverMeta.titleFontSize as number | undefined) || 28,
      titleColor: (coverMeta.titleColor as string | null | undefined) || undefined,
      titleRotation: (coverMeta.titleRotation as number | undefined) || 0,
      entries: 0,
      pages,
    }
  })

  return <JournalClient initialBooks={initialBooks} />
}
