'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, BookOpen, X, Upload, ChevronLeft, GripVertical } from 'lucide-react'
import Scrapbook, { ScrapbookPage } from '@/components/Scrapbook'

type Book = {
  id: string
  title: string
  coverColor: string
  coverImage?: string
  coverImageOffset: { x: number; y: number } // px offset for panning
  titlePos: { x: number; y: number }          // % from top-left of cover
  titleFontSize: number                        // px
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
    id: Date.now().toString(),
    title: 'New Journal',
    coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
    coverImageOffset: { x: 0, y: 0 },
    titlePos: { x: 50, y: 50 },
    titleFontSize: 28,
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
  hasCoverImage,
  onPosChange,
  onFontSizeChange,
}: {
  title: string
  pos: { x: number; y: number }
  fontSize: number
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
      onPosChange({
        x: Math.max(5, Math.min(95, nx)),
        y: Math.max(5, Math.min(95, ny)),
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
    const onUp = () => {
      resizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      ref={containerRef}
      className="absolute select-none cursor-move group"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
      onMouseDown={onMouseDownDrag}
    >
      <h3
        className="font-serif font-bold text-center whitespace-nowrap px-2 py-1 rounded transition-all"
        style={{
          fontSize: `${fontSize}px`,
          color: hasCoverImage ? 'white' : 'rgba(0,0,0,0.75)',
          textShadow: hasCoverImage ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {title || 'My Journal'}
      </h3>
      {/* Resize handle — bottom-right */}
      <div
        className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-primary-500 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center"
        onMouseDown={onMouseDownResize}
        title="Drag to resize"
      >
        <GripVertical size={10} className="text-primary-600" />
      </div>
      {/* Drag hint */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        drag to move · corner to resize
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function JournalClient() {
  const [books, setBooks] = useState<Book[]>([
    makebook({ id: '1', title: 'Daily Reflections', coverColor: COVER_COLORS[0], entries: 42, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
    makebook({ id: '2', title: 'Travel 2026', coverColor: COVER_COLORS[4], entries: 12, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
    makebook({ id: '3', title: 'Gratitude', coverColor: COVER_COLORS[2], entries: 108, pages: [{ images: [], texts: [] }, { images: [], texts: [] }] }),
  ])

  const [openBook, setOpenBook] = useState<Book | null>(null)
  const [editingCover, setEditingCover] = useState(false)

  // Cover editor local state
  const [editTitle, setEditTitle] = useState('')
  const [editColor, setEditColor] = useState(COVER_COLORS[0])
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined)
  const [editOffset, setEditOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [editTitlePos, setEditTitlePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 })
  const [editFontSize, setEditFontSize] = useState(28)

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
    setEditingCover(true)
    setOpenBook(book)
  }

  const saveCoverEdit = () => {
    if (!openBook) return
    const updated: Book = {
      ...openBook,
      title: editTitle,
      coverColor: editColor,
      coverImage: editCoverImage,
      coverImageOffset: editOffset,
      titlePos: editTitlePos,
      titleFontSize: editFontSize,
    }
    setBooks(prev => prev.map(b => b.id === openBook.id ? updated : b))
    setOpenBook(updated)
    setEditingCover(false)
  }

  const createNewBook = () => {
    const nb = makebook()
    setBooks(prev => [...prev, nb])
    openEditCover(nb)
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
          <button onClick={() => setOpenBook(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-foreground">{openBook.title}</h1>
            <p className="text-gray-500 mt-0.5 text-sm">{openBook.entries} entries</p>
          </div>
          <button
            onClick={() => openEditCover(openBook)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            Edit Cover
          </button>
        </header>

        <div className="flex-1 overflow-hidden">
          <Scrapbook
            pages={openBook.pages}
            onUpdatePages={handleUpdatePages}
          />
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

            {/* Color Picker (only without image) */}
            {!editCoverImage && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Cover Color</label>
                <div className="flex flex-wrap gap-2">
                  {COVER_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-10 h-10 rounded-xl ${c} border-4 transition-all ${editColor === c ? 'border-primary-500 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    />
                  ))}
                </div>
              </div>
            )}

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
        {books.map(book => (
          <div key={book.id} className="group cursor-pointer" onClick={() => setOpenBook(book)}>
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
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <h3
                  className="font-serif font-bold text-center"
                  style={{
                    fontSize: `${(book.titleFontSize ?? 28) * 0.6}px`,
                    color: book.coverImage ? 'white' : 'rgba(0,0,0,0.7)',
                    textShadow: book.coverImage ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  {book.title}
                </h3>
              </div>

              {/* Edit cover overlay */}
              <button
                onClick={e => { e.stopPropagation(); openEditCover(book) }}
                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm text-xs font-medium px-3"
                title="Edit Cover"
              >
                Edit
              </button>
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
