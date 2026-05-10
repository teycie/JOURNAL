'use client'

import { useState, useRef } from 'react'
import { Plus, BookOpen, Image as ImageIcon, X, Upload, ChevronLeft } from 'lucide-react'
import Scrapbook, { ScrapbookPage } from '@/components/Scrapbook'

type Book = {
  id: string
  title: string
  coverColor: string
  coverImage?: string
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

const PHOTO_LAYOUTS = [
  { id: 'single', label: 'Full Page', icon: '◻', desc: 'One large photo' },
  { id: 'two-col', label: 'Side by Side', icon: '⬜⬜', desc: '2 equal columns' },
  { id: 'grid', label: '4-Grid', icon: '⊞', desc: '2×2 photo grid' },
  { id: 'featured', label: 'Featured', icon: '▣', desc: 'Large + 2 small' },
]

type Layout = 'single' | 'two-col' | 'grid' | 'featured'

export default function JournalClient() {
  const [books, setBooks] = useState<Book[]>([
    { id: '1', title: 'Daily Reflections', coverColor: COVER_COLORS[0], entries: 42, pages: [{ images: [] }, { images: [] }] },
    { id: '2', title: 'Travel 2026', coverColor: COVER_COLORS[4], entries: 12, pages: [{ images: [] }, { images: [] }] },
    { id: '3', title: 'Gratitude', coverColor: COVER_COLORS[2], entries: 108, pages: [{ images: [] }, { images: [] }] },
  ])

  const [openBook, setOpenBook] = useState<Book | null>(null)
  const [editingCover, setEditingCover] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editColor, setEditColor] = useState(COVER_COLORS[0])
  const [editCoverImage, setEditCoverImage] = useState<string | undefined>(undefined)

  // Inside-book state
  const [selectedLayout, setSelectedLayout] = useState<Layout>('grid')
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null, null])
  const [caption, setCaption] = useState('')
  const [noteText, setNoteText] = useState('')

  const coverFileRef = useRef<HTMLInputElement>(null)
  const photoFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setEditCoverImage(url)
  }

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotos(prev => prev.map((p, i) => i === index ? url : p))
  }

  const openEditCover = (book: Book) => {
    setEditTitle(book.title)
    setEditColor(book.coverColor)
    setEditCoverImage(book.coverImage)
    setEditingCover(true)
    setOpenBook(book)
  }

  const saveCoverEdit = () => {
    if (!openBook) return
    setBooks(prev => prev.map(b =>
      b.id === openBook.id
        ? { ...b, title: editTitle, coverColor: editColor, coverImage: editCoverImage }
        : b
    ))
    setOpenBook(prev => prev ? { ...prev, title: editTitle, coverColor: editColor, coverImage: editCoverImage } : prev)
    setEditingCover(false)
  }

  const createNewBook = () => {
    const newBook: Book = {
      id: Date.now().toString(),
      title: 'New Journal',
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      entries: 0,
      pages: [{ images: [] }, { images: [] }],
    }
    setBooks(prev => [...prev, newBook])
    openEditCover(newBook)
  }

  const getPhotoSlots = () => {
    if (selectedLayout === 'single') return 1
    if (selectedLayout === 'two-col') return 2
    if (selectedLayout === 'grid') return 4
    if (selectedLayout === 'featured') return 3
    return 4
  }

  const PhotoSlot = ({ index }: { index: number }) => (
    <div
      className="relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group border-2 border-dashed border-gray-200 hover:border-primary-300 transition-colors h-full"
      onClick={() => photoFileRefs.current[index]?.click()}
    >
      {photos[index] ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[index]!} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
          <button
            onClick={e => { e.stopPropagation(); setPhotos(prev => prev.map((p, i) => i === index ? null : p)) }}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary-400 transition-colors">
          <Upload size={20} />
          <span className="text-xs font-medium">Add Photo</span>
        </div>
      )}
      <input
        ref={el => { photoFileRefs.current[index] = el }}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handlePhotoUpload(index, e)}
      />
    </div>
  )

  const renderPhotoLayout = () => {
    const slots = getPhotoSlots()
    if (selectedLayout === 'single') return (
      <div className="w-full h-64"><PhotoSlot index={0} /></div>
    )
    if (selectedLayout === 'two-col') return (
      <div className="grid grid-cols-2 gap-3 h-64">
        <PhotoSlot index={0} />
        <PhotoSlot index={1} />
      </div>
    )
    if (selectedLayout === 'grid') return (
      <div className="grid grid-cols-2 gap-3 h-64">
        <PhotoSlot index={0} />
        <PhotoSlot index={1} />
        <PhotoSlot index={2} />
        <PhotoSlot index={3} />
      </div>
    )
    if (selectedLayout === 'featured') return (
      <div className="grid grid-cols-3 gap-3 h-64">
        <div className="col-span-2 row-span-2"><PhotoSlot index={0} /></div>
        <PhotoSlot index={1} />
        <PhotoSlot index={2} />
      </div>
    )
  }

  // ─── Open Book View ────────────────────────────────────────────────────────
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
            <ImageIcon size={16} />
            Edit Cover
          </button>
        </header>

        {/* Scrapbook component */}
        <div className="flex-1 overflow-hidden">
          <Scrapbook 
            pages={openBook.pages || [{ images: [] }, { images: [] }]} 
            onUpdatePages={(newPages) => {
              setBooks(prev => prev.map(b => b.id === openBook.id ? { ...b, pages: newPages } : b))
            }}
          />
        </div>

        <div className="flex justify-end p-6 bg-white/40 backdrop-blur-sm border-t border-gray-100">
          <button className="btn-primary px-8" onClick={() => setOpenBook(null)}>Save & Close Book</button>
        </div>
      </div>
    )
  }

  // ─── Edit Cover View ───────────────────────────────────────────────────────
  if (editingCover && openBook) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="mb-6 flex items-center gap-4">
          <button onClick={() => setEditingCover(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-2xl font-serif font-bold text-foreground">Edit Cover</h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
          {/* Cover Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className={`aspect-[3/4] w-full max-w-xs rounded-2xl shadow-lg relative overflow-hidden ${!editCoverImage ? editColor : ''}`}>
              {editCoverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editCoverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-black/10" />
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-black/10" />
                </>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                {!editCoverImage && <BookOpen className="w-14 h-14 text-black/20 mb-4" />}
                <h3 className="font-serif font-bold text-2xl text-center" style={{ color: editCoverImage ? 'white' : 'rgba(0,0,0,0.7)', textShadow: editCoverImage ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>
                  {editTitle || 'My Journal'}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-400">Live Preview</p>
          </div>

          {/* Cover Editor */}
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

            {/* Cover Image Upload */}
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
                    <button onClick={e => { e.stopPropagation(); setEditCoverImage(undefined) }} className="ml-auto text-gray-400 hover:text-red-500">
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

            {/* Color Picker */}
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

  // ─── Books Grid View ───────────────────────────────────────────────────────
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
            <div className={`aspect-[3/4] rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group-hover:-translate-y-2 mb-4 relative overflow-hidden ${!book.coverImage ? book.coverColor : ''}`}>
              {book.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-black/10" />
                  <div className="absolute left-7 top-0 bottom-0 w-px bg-black/10" />
                </>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {!book.coverImage && <BookOpen className="w-12 h-12 text-black/20 mb-4" />}
                <h3 className="font-serif font-bold text-xl" style={{ color: book.coverImage ? 'white' : 'rgba(0,0,0,0.7)', textShadow: book.coverImage ? '0 1px 4px rgba(0,0,0,0.5)' : 'none' }}>
                  {book.title}
                </h3>
              </div>

              {/* Edit cover overlay */}
              <button
                onClick={e => { e.stopPropagation(); openEditCover(book) }}
                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                title="Edit Cover"
              >
                <ImageIcon size={14} />
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
