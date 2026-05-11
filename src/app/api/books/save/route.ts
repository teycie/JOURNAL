import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

type BookPayload = {
  id?: string
  title: string
  coverColor?: string
  coverImage?: string
  coverImageOffset?: { x: number; y: number }
  titlePos?: { x: number; y: number }
  titleFontSize?: number
  titleColor?: string
  titleRotation?: number
  pages?: unknown[]
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const book = body?.book as BookPayload | undefined

    if (!book?.title) {
      return NextResponse.json({ error: 'Missing book payload' }, { status: 400 })
    }

    const coverMeta = {
      coverImageOffset: book.coverImageOffset ?? { x: 0, y: 0 },
      titlePos: book.titlePos ?? { x: 50, y: 50 },
      titleFontSize: book.titleFontSize ?? 28,
      titleColor: book.titleColor ?? null,
      titleRotation: book.titleRotation ?? 0,
      pages: book.pages ?? [],
    }

    const basePayload: Record<string, unknown> = {
      ...(book.id && uuidPattern.test(book.id) ? { id: book.id } : {}),
      user_id: user.id,
      title: book.title,
      cover_color: book.coverColor ?? null,
      cover_url: book.coverImage ?? null,
      cover_meta: coverMeta,
      pages: book.pages ?? [],
      updated_at: new Date().toISOString(),
    }

    const retryPayloads: Record<string, unknown>[] = [
      basePayload,
      {
        ...(book.id && uuidPattern.test(book.id) ? { id: book.id } : {}),
        user_id: user.id,
        title: book.title,
        cover_color: book.coverColor ?? null,
        cover_url: book.coverImage ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        ...(book.id && uuidPattern.test(book.id) ? { id: book.id } : {}),
        user_id: user.id,
        title: book.title,
        updated_at: new Date().toISOString(),
      },
    ]

    let data: unknown = null
    let lastError: string | null = null

    for (const payload of retryPayloads) {
      const query = book.id && uuidPattern.test(book.id)
        ? supabase.from('books').upsert(payload, { onConflict: 'id' })
        : supabase.from('books').insert(payload)

      const result = await query.select().single()
      if (!result.error) {
        data = result.data
        break
      }
      lastError = result.error.message
    }

    if (!data) {
      return NextResponse.json({ error: lastError ?? 'Failed to save book' }, { status: 500 })
    }

    return NextResponse.json({ book: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}