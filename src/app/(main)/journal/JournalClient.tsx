'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, BookOpen, X, Upload, ChevronLeft, GripVertical, Trash2, Pencil, ChevronRight, Eye } from 'lucide-react'
import Scrapbook, { ScrapbookPage } from '@/components/Scrapbook'

type Book = {
  id: string
  title: string
  coverColor: string
  coverImage?: string
  coverImageOffset: { x: number; y: number } // px offset for panning
  titlePos: { x: number; y: number }          // % from top-left of cover
  titleFontSize: number                        // px
  titleColor?: string                          // hex color
  titleRotation?: number                       // degrees 0-360
  entries: number
  pages: ScrapbookPage[]
}

const COVER_COLORS = [
  'bg-gradient-to-br from-violet-200 to-purple-300',
  'bg-gradient-to-br from-pink-200 to-rose-300',
  'bg-gradient-to-br from-emerald-200 to-teal-300',
  'bg-gradient-to-br from-amber-200 to-orange-300',
  'bg-gradient-to-br from-sky-200 to-blue-300',
  'bg-gradient-to-br from-fuchsia-200 to-pink-300',
  'bg-gradient-to-br from-lime-200 to-green-300',
  'bg-gradient-to-br from-red-200 to-rose-300',
]

function makebook(overrides: Partial<Book> = {}): Book {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    title: 'New Journal',
    coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
    coverImageOffset: { x: 0, y: 0 },
    titlePos: { x: 50, y: 50 },
    titleFontSize: 28,
    titleColor: undefined,
    titleRotation: 0,
    entries: 0,
    pages: [{ images: [], texts: [] }, { images: [], texts: [] }],
    ...overrides,
  }
}

/* ─── Draggable + Resizable Title on Cover ───────────────────────────────── */
function DraggableCoverTitle({
  title,
  pos,
  fontSize,
  color,
  rotation,
  hasCoverImage,
  onPosChange,
  onFontSizeChange,
}: {
  title: string
  pos: { x: number; y: number }
  fontSize: number
  color?: string
  rotation?: number
  hasCoverImage: boolean
  onPosChange: (p: { x: number; y: number }) => void
  onFontSizeChange: (s: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const resizing = useRef(false)
  const startData = useRef({ mouseX: 0, mouseY: 0, fontSize: fontSize })

  const onMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const parent = containerRef.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return
      const nx = ((me.clientX - rect.left) / rect.width) * 100
      const ny = ((me.clientY - rect.top) / rect.height) * 100
      onPosChange({ x: Math.max(5, Math.min(95, nx)), y: Math.max(5, Math.min(95, ny)) })
    }
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    startData.current = { mouseX: e.clientX, mouseY: e.clientY, fontSize }
    const onMove = (me: MouseEvent) => {
      if (!resizing.current) return
      const delta = (me.clientX - startData.current.mouseX) * 0.4
      onFontSizeChange(Math.max(12, Math.min(80, startData.current.fontSize + delta)))
    }
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const resolvedColor = color || (hasCoverImage ? 'white' : 'rgba(0,0,0,0.75)')

  return (
    <div
      ref={containerRef}
      className="absolute select-none cursor-move group"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation ?? 0}deg)`,
      }}
      onMouseDown={onMouseDownDrag}
    >
      <h3
        className="font-serif font-bold text-center whitespace-nowrap px-2 py-1 rounded transition-all"
        style={{
          fontSize: `${fontSize}px`,
          color: resolvedColor,
          textShadow: hasCoverImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {title || 'My Journal'}
      </h3>
      {/* Resize handle */}
      <div
        className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-primary-500 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center"
        onMouseDown={onMouseDownResize}
        title="Drag to resize"
      >
        <GripVertical size={10} className="text-primary-600" />
      </div>
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        drag · corner to resize
      </div>
    </div>
  )
}

/* ─── Pannable Cover Image ───────────────────────────────────────────────── */
function PannableCoverImage({
  src,
  offset,
  onOffsetChange,
}: {
  src: string
  offset: { x: number; y: number }
  onOffsetChange: (o: { x: number; y: number }) => void
}) {
  const dragging = useRef(false)
  const startData = useRef({ mouseX: 0, mouseY: 0, ox: 0, oy: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startData.current = { mouseX: e.clientX, mouseY: e.clientY, ox: offset.x, oy: offset.y }

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return
      onOffsetChange({
        x: startData.current.ox + (me.clientX - startData.current.mouseX),
        y: startData.current.oy + (me.clientY - startData.current.mouseY),
      })
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={onMouseDown}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Cover"
        className="absolute w-[140%] h-[140%] object-cover pointer-events-none select-none"
        style={{ top: offset.y, left: offset.x }}
        draggable={false}
      />
      <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
        drag to reposition
      </div>
    </div>
  )
}

/* ─── View-Only Page Viewer ──────────────────────────────────────────────── */
function ViewerScrapbook({ pages }: { pages: ScrapbookPage[] }) {
  const normalized = pages.length > 0
    ? pages.map(p => ({ images: p.images || [], texts: (p.texts || []).map(text => ({ ...text, rotation: text.rotation ?? 0 })) }))
    : [{ images: [], texts: [] }, { images: [], texts: [] }]

  const [idx, setIdx] = useState(0)
  const totalSpreads = Math.ceil(normalized.length / 2)
  const currentSpread = Math.floor(idx / 2) + 1

  const prev = () => idx >= 2 && setIdx(i => i - 2)
  const next = () => idx + 2 < normalized.length && setIdx(i => i + 2)

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' && idx + 2 < normalized.length) setIdx(i => i + 2)
    if (e.key === 'ArrowLeft' && idx >= 2) setIdx(i => i - 2)
  }, [idx, normalized.length])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  const leftPage = normalized[idx] ?? { images: [], texts: [] }
  const rightPage = normalized[idx + 1] ?? { images: [], texts: [] }

  const renderPage = (page: ScrapbookPage, pageNum: number) => (
    <div className="flex-1 bg-[#fdfdfb] relative overflow-hidden">
      {/* Grid watermark */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* Texts */}
      {(page.texts || []).map((txt, i) => (
        <div key={`${txt.id}-${i}`} className="absolute pointer-events-none select-none" style={{ left: `${txt.x}%`, top: `${txt.y}%`, width: `${txt.width}%`, fontSize: txt.fontSize, color: txt.color, fontWeight: txt.bold ? 700 : 400, fontStyle: txt.italic ? 'italic' : 'normal', textDecoration: txt.underline ? 'underline' : 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', transform: `rotate(${txt.rotation ?? 0}deg)` }}>
          {txt.content}
        </div>
      ))}
      {/* Images */}
      {page.images.map((img, i) => (
        <div key={`${img.id}-${i}`} className="absolute pointer-events-none" style={{ left: `${img.x}%`, top: `${img.y}%`, width: `${img.width}%`, height: `${img.height}%`, transform: `rotate(${img.rotation}deg)` }}>
          <div className="absolute inset-0 bg-white shadow-lg rounded-sm border border-gray-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="w-full h-full object-cover" draggable={false} />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/40 backdrop-blur-sm border border-white/30 rotate-[-2deg]" />
          </div>
        </div>
      ))}
      {page.images.length === 0 && (page.texts || []).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-sm font-serif italic pointer-events-none">Empty page</div>
      )}
      <div className="absolute bottom-3 text-[10px] text-gray-300 font-serif tracking-widest pointer-events-none" style={{ [pageNum % 2 === 1 ? 'left' : 'right']: '1rem' }}>{pageNum}</div>
    </div>
  )

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-4 px-4 h-full">
      {/* Book */}
      <div className="relative w-full flex-1 min-h-0" style={{ maxHeight: '65vh' }}>
        <div className="absolute inset-0 bg-black/10 blur-3xl rounded-[3rem] -z-10 translate-y-8" />
        <div className="absolute inset-0 flex p-3 bg-[#4a3b2b] rounded-[2rem] shadow-2xl overflow-hidden border-8" style={{ borderColor: 'var(--book-border-color, #3a2f22)' }}>
          {/* Left page */}
          <div className="flex-1 shadow-[inset_-1px_0_10px_rgba(0,0,0,0.08)] rounded-l-xl relative overflow-hidden">
            {renderPage(leftPage, idx + 1)}
          </div>
          {/* Spine */}
          <div className="w-6 relative z-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 -translate-x-1/2" />
          </div>
          {/* Right page */}
          <div className="flex-1 shadow-[inset_1px_0_10px_rgba(0,0,0,0.08)] rounded-r-xl relative overflow-hidden">
            {renderPage(rightPage, idx + 2)}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-4">
        <button onClick={prev} disabled={idx === 0} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-colors shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-gray-500 min-w-[110px] text-center">
          Spread {currentSpread} / {totalSpreads}
        </span>
        <button onClick={next} disabled={idx + 2 >= normalized.length} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-colors shadow-sm">
          <ChevronRight size={20} />
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-400">Use ← → arrow keys to flip pages</p>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function JournalClient() {
  const [books, setBooks] = useState<Book[]>([
    makebook({ title: 'Daily Reflections', coverColor: COVER_COLORS[0], entries: 42, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
    makebook({ title: 'Travel 2026', coverColor: COVER_COLORS[4], entries: 12, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
    makebook({ title: 'Gratitude', coverColor: COVER_COLORS[2], entries: 108, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
  ])

  const [openBook, setOpenBook] = useState<Book | null>(null)
  const [editingCover, setEditingCover] = useState(false)
  const [viewMode, setViewMode] = useState(false) // true = read-only viewer

  // Cover editor local state
  const [editTitle, setEditTitle] = useState('')
  const [editColor, setEditColor] = useState(COVER_COLORS[0])
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined)
  const [editOffset, setEditOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [editTitlePos, setEditTitlePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [editFontSize, setEditFontSize] = useState(28)
  const [editTitleColor, setEditTitleColor] = useState<string>('#000000')
  const [editTitleRotation, setEditTitleRotation] = useState(0)

  const coverFileRef = useRef<HTMLInputElement>(null)

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditCoverImage(URL.createObjectURL(file))
  }

  const openEditCover = (book: Book) => {
    setEditTitle(book.title)
    setEditColor(book.coverColor)
    setEditCoverImage(book.coverImage)
    setEditOffset(book.coverImageOffset || { x: 0, y: 0 })
    setEditTitlePos(book.titlePos || { x: 50, y: 50 })
    setEditFontSize(book.titleFontSize || 28)
    setEditTitleColor(book.titleColor || '#000000')
    setEditTitleRotation(book.titleRotation ?? 0)
    setEditingCover(true)
    setViewMode(false)
    setOpenBook(book)
  }

  const openViewBook = (book: Book) => {
    setOpenBook(book)
    setViewMode(true)
    setEditingCover(false)
  }

  const saveCoverEdit = async () => {
    if (!openBook) return
    const updated: Book = {
      ...openBook,
      title: editTitle,
      coverColor: editColor,
      coverImage: editCoverImage,
      coverImageOffset: editOffset,
      titlePos: editTitlePos,
      titleFontSize: editFontSize,
      titleColor: editTitleColor,
      titleRotation: editTitleRotation,
    }

    const response = await fetch('/api/books/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book: updated }),
    })

    if (!response.ok) {
      alert('Failed to save book. Please try again.')
      return
    }

    const result = await response.json()
    const savedBook = result.book ?? updated
    setBooks(prev => prev.map(b => b.id === openBook.id ? savedBook : b))
    setOpenBook(savedBook)
    setEditingCover(false)
  }

  const createNewBook = () => {
    const nb = makebook()
    setBooks(prev => [...prev, nb])
    openEditCover(nb)
  }

  const deleteBook = (id: string) => {
    if (!confirm('Delete this journal? This cannot be undone.')) return
    setBooks(prev => prev.filter(b => b.id !== id))
    if (openBook?.id === id) setOpenBook(null)
  }

  const updatePages = useCallback((bookId: string, newPages: ScrapbookPage[]) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, pages: newPages } : b))
    setOpenBook(prev => prev && prev.id === bookId ? { ...prev, pages: newPages } : prev)
  }, [])

  // Stable callback for the currently open book — only changes when openBook.id changes
  const openBookId = openBook?.id
  const handleUpdatePages = useCallback(
    (newPages: ScrapbookPage[]) => { if (openBookId) updatePages(openBookId, newPages) },
    [openBookId, updatePages]
  )

  /* ── Open Book View ─────────────────────────────────────────────────────── */
  if (openBook && !editingCover) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-6 flex items-center gap-4">
          <button onClick={() => { setOpenBook(null); setViewMode(false) }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">{openBook.title}</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              {viewMode ? <span className="flex items-center gap-1"><Eye size={13} /> View-only mode</span> : <span className="text-primary-500 font-medium">✏️ Editing pages</span>}
            </p>
          </div>
          {viewMode ? (
            /* View mode: two buttons — Edit Pages and Edit Cover */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(false)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <Pencil size={14} /> Edit Pages
              </button>
              <button
                onClick={() => openEditCover(openBook)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                Edit Cover
              </button>
            </div>
          ) : (
            /* Edit mode: show Edit Cover + back to view */
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Eye size={14} /> View
              </button>
              <button
                onClick={() => openEditCover(openBook)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                Edit Cover
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-hidden">
          {viewMode ? (
            <ViewerScrapbook pages={openBook.pages} />
          ) : (
            <Scrapbook
              pages={openBook.pages}
              onUpdatePages={handleUpdatePages}
            />
          )}
        </div>
      </div>
    )
  }

  /* ── Edit Cover View ────────────────────────────────────────────────────── */
  if (editingCover && openBook) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-6 flex items-center gap-4">
          <button onClick={() => { setEditingCover(false); setOpenBook(null) }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-serif font-bold text-foreground">Edit Cover</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-auto">
          {/* Live Cover Preview — interactive */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={`aspect-[3/4] w-full max-w-xs rounded-2xl shadow-xl relative overflow-hidden border border-white/20 ${!editCoverImage ? editColor : ''}`}
            >
              {editCoverImage ? (
                <PannableCoverImage
                  src={editCoverImage}
                  offset={editOffset}
                  onOffsetChange={setEditOffset}
                />
              ) : (
                <>
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-black/10" />
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-black/10" />
                </>
              )}
              {/* Always show draggable title on top */}
              <DraggableCoverTitle
                title={editTitle}
                pos={editTitlePos}
                fontSize={editFontSize}
                color={editTitleColor}
                rotation={editTitleRotation}
                hasCoverImage={!!editCoverImage}
                onPosChange={setEditTitlePos}
                onFontSizeChange={setEditFontSize}
              />
              {!editCoverImage && (
                <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
                  <BookOpen className="w-14 h-14 text-black/10" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400">Live preview — drag title, resize corner, pan image</p>
          </div>

          {/* Cover Editor Form */}
          <div className="glass-panel p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Book Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Name your journal..."
                className="w-full px-4 py-2 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 text-sm font-serif"
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Cover Image</label>
              <div
                onClick={() => coverFileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-primary-300 rounded-xl p-4 cursor-pointer text-center transition-colors group"
              >
                {editCoverImage ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editCoverImage} alt="cover thumb" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="text-sm text-gray-600">Image selected — click to change</span>
                    <button
                      onClick={e => { e.stopPropagation(); setEditCoverImage(undefined); setEditOffset({ x: 0, y: 0 }) }}
                      className="ml-auto text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary-400 py-2 transition-colors">
                    <Upload size={22} />
                    <span className="text-sm font-medium">Upload a photo</span>
                    <span className="text-xs text-gray-300">PNG, JPG, WEBP</span>
                  </div>
                )}
              </div>
              <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
            </div>

            {/* Cover Color (only without image) */}
            {!editCoverImage && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Cover Color</label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map((c, i) => (
                    <button
                      key={`${c}-${i}`}
                      onClick={() => setEditColor(c)}
                      className={`w-10 h-10 rounded-xl ${c} border-4 transition-all ${editColor === c ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Title Color */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Title Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editTitleColor}
                  onChange={e => setEditTitleColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                />
                <span className="text-xs text-gray-500">Click to pick a color for the cover title</span>
              </div>
            </div>

            {/* Title Rotation */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Title Rotation: {editTitleRotation}°</label>
              <input
                type="range"
                min={0}
                max={360}
                value={editTitleRotation}
                onChange={e => setEditTitleRotation(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>0°</span><span>180°</span><span>360°</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveCoverEdit} className="btn-primary flex-1">Save Cover</button>
              <button onClick={() => { setEditingCover(false); setOpenBook(null) }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Books Grid View ────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Your Journals</h1>
          <p className="text-gray-500 mt-1">Organize your memories into beautiful books.</p>
        </div>
        <button onClick={createNewBook} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Book
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book, i) => (
          <div key={`${book.id}-${i}`} className="group cursor-pointer" onClick={() => openViewBook(book)}>
            <div className={`aspect-[3/4] rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 mb-4 relative overflow-hidden ${!book.coverImage ? book.coverColor : ''}`}>
              {book.coverImage ? (
                <div className="absolute inset-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="absolute w-[140%] h-[140%] object-cover pointer-events-none select-none"
                    style={{ top: book.coverImageOffset?.y ?? 0, left: book.coverImageOffset?.x ?? 0 }}
                    draggable={false}
                  />
                </div>
              ) : (
                <>
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-black/10" />
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-black/10" />
                </>
              )}

              {/* Title at saved position */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${book.titlePos?.x ?? 50}%`,
                  top: `${book.titlePos?.y ?? 50}%`,
                  transform: `translate(-50%, -50%) rotate(${book.titleRotation ?? 0}deg)`,
                }}
              >
                <h3
                  className="font-serif font-bold text-center"
                  style={{
                    fontSize: `${(book.titleFontSize ?? 28) * 0.6}px`,
                    color: book.titleColor || (book.coverImage ? 'white' : 'rgba(0,0,0,0.7)'),
                    textShadow: book.coverImage ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  {book.title}
                </h3>
              </div>

              {/* Edit / Delete overlay buttons */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); openEditCover(book) }}
                  className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl backdrop-blur-sm text-xs font-medium flex items-center gap-1 px-2.5"
                  title="Edit Cover"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={e => { e.stopPropagation(); deleteBook(book.id) }}
                  className="p-2 bg-red-500/70 hover:bg-red-600/90 text-white rounded-xl backdrop-blur-sm flex items-center justify-center"
                  title="Delete Journal"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <div className="px-2">
              <h4 className="font-medium text-foreground">{book.title}</h4>
              <p className="text-sm text-gray-500">{book.entries} entries</p>
            </div>
          </div>
        ))}

        {/* Create New Book Card */}
        <div className="group cursor-pointer" onClick={createNewBook}>
          <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 hover:bg-white hover:border-primary-300 transition-all group-hover:-translate-y-2 mb-4 flex flex-col items-center justify-center text-gray-400 group-hover:text-primary-500 duration-300">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-primary-50 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">Create New Book</span>
          </div>
        </div>
      </div>
    </div>
  )
}
