'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Bold, Italic, Underline, Type, Image as ImageIcon, X, AlertTriangle, RotateCcw, RotateCw } from 'lucide-react'

export type ScrapbookImage = {
  id: string
  url: string
  x: number; y: number
  width: number; height: number
  rotation: number
  zIndex: number
}

export type ScrapbookText = {
  id: string
  content: string
  x: number; y: number
  width: number
  fontSize: number
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
  rotation: number
  zIndex: number
}

export type ScrapbookPage = {
  images: ScrapbookImage[]
  texts?: ScrapbookText[]
}

/* ─── Robust ID generator ──────────────────────────────────────── */
function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

/* ─── Resize / Drag helpers ──────────────────────────────────────────────── */
function useDragMove(
  item: { x: number; y: number },
  containerRef: React.RefObject<HTMLDivElement | null>,
  onUpdate: (u: Partial<{ x: number; y: number }>) => void
) {
  const dragging = useRef(false)
  const start = useRef({ mx: 0, my: 0, ix: 0, iy: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = true
    start.current = { mx: e.clientX, my: e.clientY, ix: item.x, iy: item.y }

    const move = (me: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dx = ((me.clientX - start.current.mx) / width) * 100
      const dy = ((me.clientY - start.current.my) / height) * 100
      onUpdate({ x: Math.max(0, Math.min(90, start.current.ix + dx)), y: Math.max(0, Math.min(90, start.current.iy + dy)) })
    }
    const up = () => { dragging.current = false; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [item.x, item.y, containerRef, onUpdate])

  return onMouseDown
}

function useResizeCorner(
  item: { width: number; height: number },
  containerRef: React.RefObject<HTMLDivElement | null>,
  onUpdate: (u: Partial<{ width: number; height: number }>) => void
) {
  const start = useRef({ mx: 0, my: 0, iw: 0, ih: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    start.current = { mx: e.clientX, my: e.clientY, iw: item.width, ih: item.height }

    const move = (me: MouseEvent) => {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const dw = ((me.clientX - start.current.mx) / width) * 100
      const dh = ((me.clientY - start.current.my) / height) * 100
      onUpdate({ width: Math.max(10, Math.min(90, start.current.iw + dw)), height: Math.max(10, Math.min(90, start.current.ih + dh)) })
    }
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [item.width, item.height, containerRef, onUpdate])

  return onMouseDown
}

/* ─── Image Item ─────────────────────────────────────────────────────────── */
function ImageItem({
  image, isSelected, pageRef,
  onSelect, onUpdate, onDelete,
}: {
  image: ScrapbookImage
  isSelected: boolean
  pageRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onUpdate: (u: Partial<ScrapbookImage>) => void
  onDelete: () => void
}) {
  const onDragMove = useDragMove(image, pageRef, onUpdate)
  const onResizeSE = useResizeCorner(image, pageRef, onUpdate)

  return (
    <div
      className={`absolute select-none ${isSelected ? 'z-50' : 'z-10'}`}
      style={{ left: `${image.x}%`, top: `${image.y}%`, width: `${image.width}%`, height: `${image.height}%`, transform: `rotate(${image.rotation}deg)` }}
      onClick={e => { e.stopPropagation(); onSelect() }}
    >
      {/* Drag handle — whole image (except controls) */}
      <div
        className="absolute inset-0 cursor-move bg-white shadow-lg rounded-sm border border-gray-100 overflow-hidden"
        onMouseDown={onDragMove}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />
        {/* Decorative tape */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/40 backdrop-blur-sm border border-white/30 rotate-[-2deg] pointer-events-none" />
      </div>

      {isSelected && (
        <>
          {/* Delete button */}
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 z-20"
          >
            <X size={12} />
          </button>
          {/* Rotation buttons — constrained to ±80° (160° total) */}
          <button
            onClick={e => { e.stopPropagation(); onUpdate({ rotation: Math.max(-80, image.rotation - 15) }) }}
            className="absolute -top-3 left-0 w-6 h-6 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 z-20"
            title="Rotate left"
          >
            <RotateCcw size={10} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onUpdate({ rotation: Math.min(80, image.rotation + 15) }) }}
            className="absolute -top-3 left-7 w-6 h-6 bg-white border border-gray-200 text-gray-600 rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 z-20"
            title="Rotate right"
          >
            <RotateCw size={10} />
          </button>
          {/* Resize handle SE */}
          <div
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary-600 rounded-full border-2 border-white cursor-nwse-resize shadow-md z-20"
            onMouseDown={onResizeSE}
          />
          {/* Selection ring */}
          <div className="absolute inset-0 ring-2 ring-primary-500 ring-offset-1 rounded-sm pointer-events-none" />
        </>
      )}
    </div>
  )
}

/* ─── Text Item ──────────────────────────────────────────────────────────── */
function TextItem({
  text, isSelected, pageRef,
  onSelect, onUpdate, onDelete,
}: {
  text: ScrapbookText
  isSelected: boolean
  pageRef: React.RefObject<HTMLDivElement | null>
  onSelect: () => void
  onUpdate: (u: Partial<ScrapbookText>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const onDragMove = useDragMove(text, pageRef, onUpdate)

  const toolbar = isSelected && (
    <div className="absolute -top-12 left-0 flex flex-wrap items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1 z-30" onClick={e => e.stopPropagation()}>
      <button onClick={() => onUpdate({ bold: !text.bold })} className={`p-1 rounded transition-colors ${text.bold ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}><Bold size={12} /></button>
      <button onClick={() => onUpdate({ italic: !text.italic })} className={`p-1 rounded transition-colors ${text.italic ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}><Italic size={12} /></button>
      <button onClick={() => onUpdate({ underline: !text.underline })} className={`p-1 rounded transition-colors ${text.underline ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}><Underline size={12} /></button>
      <div className="w-px h-4 bg-gray-200" />
      <input type="color" value={text.color} onChange={e => onUpdate({ color: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-0 p-0" title="Text color" />
      <div className="w-px h-4 bg-gray-200" />
      <select value={text.fontSize} onChange={e => onUpdate({ fontSize: Number(e.target.value) })} className="text-xs border-0 outline-none bg-transparent" onClick={e => e.stopPropagation()}>
        {[10,12,14,16,18,20,24,28,32,40].map(s => <option key={s} value={s}>{s}px</option>)}
      </select>
      <div className="w-px h-4 bg-gray-200" />
      <div className="flex items-center gap-0.5">
        <button onClick={() => onUpdate({ rotation: (text.rotation - 15 + 360) % 360 })} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Rotate left"><RotateCcw size={11} /></button>
        <input type="range" min={0} max={360} value={text.rotation} onChange={e => onUpdate({ rotation: Number(e.target.value) })} className="w-12 h-2 accent-primary-500" title="Rotate" />
        <button onClick={() => onUpdate({ rotation: (text.rotation + 15) % 360 })} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Rotate right"><RotateCw size={11} /></button>
      </div>
      <div className="w-px h-4 bg-gray-200" />
      <button onClick={() => onDelete()} className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
    </div>
  )

  return (
    <div
      className={`absolute select-none ${isSelected ? 'z-40' : 'z-20'}`}
      style={{ left: `${text.x}%`, top: `${text.y}%`, width: `${text.width}%` }}
      onClick={e => { e.stopPropagation(); onSelect() }}
    >
      {toolbar}
      {/* Drag bar */}
      <div
        className="absolute -top-3 left-0 right-0 h-3 cursor-move flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        onMouseDown={onDragMove}
      >
        <div className="w-8 h-1 rounded bg-gray-300" />
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={text.content}
          onChange={e => onUpdate({ content: e.target.value })}
          onBlur={() => setEditing(false)}
          className="w-full bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-primary-400 rounded border border-primary-300 p-1"
          style={{
            fontSize: text.fontSize,
            color: text.color,
            fontWeight: text.bold ? 700 : 400,
            fontStyle: text.italic ? 'italic' : 'normal',
            textDecoration: text.underline ? 'underline' : 'none',
            transform: `rotate(${text.rotation}deg)`,
            minHeight: 40,
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div
          className={`w-full cursor-text rounded p-1 min-h-[24px] ${isSelected ? 'border border-dashed border-primary-300 bg-primary-50/20' : 'border border-transparent hover:border-dashed hover:border-gray-300'}`}
          onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
          onMouseDown={!isSelected ? undefined : onDragMove}
          style={{
            fontSize: text.fontSize,
            color: text.color,
            fontWeight: text.bold ? 700 : 400,
            fontStyle: text.italic ? 'italic' : 'normal',
            textDecoration: text.underline ? 'underline' : 'none',
            transform: `rotate(${text.rotation}deg)`,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {text.content || <span className="text-gray-300 text-sm italic">Double-click to edit…</span>}
        </div>
      )}
    </div>
  )
}

/* ─── Page Canvas ────────────────────────────────────────────────────────── */
function PageCanvas({
  page, pageIndex,
  selectedId, onSelectId,
  onUpdateImage, onDeleteImage,
  onUpdateText, onDeleteText,
  onClickEmpty,
}: {
  page: ScrapbookPage
  pageIndex: number
  selectedId: string | null
  onSelectId: (id: string | null) => void
  onUpdateImage: (pi: number, id: string, u: Partial<ScrapbookImage>) => void
  onDeleteImage: (pi: number, id: string) => void
  onUpdateText: (pi: number, id: string, u: Partial<ScrapbookText>) => void
  onDeleteText: (pi: number, id: string) => void
  onClickEmpty: (pi: number, x: number, y: number) => void
}) {
  const pageRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    if (e.target !== pageRef.current) return
    const rect = pageRef.current!.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    onClickEmpty(pageIndex, x, y)
    onSelectId(null)
  }

  return (
    <div
      ref={pageRef}
      className="absolute inset-0 p-4"
      onClick={handleClick}
    >
      {/* Grid lines watermark */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      {(page.texts || []).map((txt, i) => (
        <TextItem
          key={txt.id || `txt-${pageIndex}-${i}`}
          text={txt}
          isSelected={selectedId === txt.id}
          pageRef={pageRef}
          onSelect={() => onSelectId(txt.id)}
          onUpdate={u => onUpdateText(pageIndex, txt.id, u)}
          onDelete={() => onDeleteText(pageIndex, txt.id)}
        />
      ))}

      {page.images.map((img, i) => (
        <ImageItem
          key={img.id || `img-${pageIndex}-${i}`}
          image={img}
          isSelected={selectedId === img.id}
          pageRef={pageRef}
          onSelect={() => onSelectId(img.id)}
          onUpdate={u => onUpdateImage(pageIndex, img.id, u)}
          onDelete={() => onDeleteImage(pageIndex, img.id)}
        />
      ))}

      {page.images.length === 0 && (page.texts || []).length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-3 pointer-events-none">
          <ImageIcon size={40} strokeWidth={1} />
          <p className="font-serif italic text-sm">Click anywhere to add text · use toolbar to add images</p>
        </div>
      )}
    </div>
  )
}

/* ─── Delete Page Modal ──────────────────────────────────────────────────── */
function DeletePageModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <h3 className="font-serif font-bold text-lg text-foreground">Delete Page?</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">This will permanently remove this page spread and all its content. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors text-sm">Delete</button>
          <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm">Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Scrapbook ─────────────────────────────────────────────────────── */
interface ScrapbookProps {
  pages: ScrapbookPage[]
  onUpdatePages: (pages: ScrapbookPage[]) => void
}

export default function Scrapbook({ pages: initialPages, onUpdatePages }: ScrapbookProps) {
  const normalize = (ps: ScrapbookPage[]) =>
    ps.length > 0
      ? ps.map(p => ({
          images: p.images || [],
          texts: (p.texts || []).map(text => ({ ...text, rotation: text.rotation ?? 0 })),
        }))
      : [{ images: [], texts: [] }, { images: [], texts: [] }]

  const [pages, setPages] = useState<ScrapbookPage[]>(() => normalize(initialPages))
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left')

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Store callback in a ref so it never causes a re-render loop
  const onUpdatePagesRef = useRef(onUpdatePages)
  useEffect(() => { onUpdatePagesRef.current = onUpdatePages })

  // Auto-save: call parent whenever pages state changes (not on every parent re-render)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    onUpdatePagesRef.current(pages)
  }, [pages])

  const leftPage = pages[currentPageIndex] ?? { images: [], texts: [] }
  const rightPage = pages[currentPageIndex + 1] ?? { images: [], texts: [] }

  /* mutations */
  const setPagesMut = (fn: (p: ScrapbookPage[]) => ScrapbookPage[]) => setPages(prev => fn([...prev]))

  const updateImage = (pi: number, id: string, u: Partial<ScrapbookImage>) =>
    setPagesMut(ps => { ps[pi].images = ps[pi].images.map(img => img.id === id ? { ...img, ...u } : img); return ps })

  const deleteImage = (pi: number, id: string) =>
    setPagesMut(ps => { ps[pi].images = ps[pi].images.filter(img => img.id !== id); return ps })

  const updateText = (pi: number, id: string, u: Partial<ScrapbookText>) =>
    setPagesMut(ps => { ps[pi].texts = (ps[pi].texts || []).map(t => t.id === id ? { ...t, ...u } : t); return ps })

  const deleteText = (pi: number, id: string) =>
    setPagesMut(ps => { ps[pi].texts = (ps[pi].texts || []).filter(t => t.id !== id); return ps })

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const img: ScrapbookImage = { id: genId(), url, x: 15, y: 15, width: 40, height: 40, rotation: (Math.random() - 0.5) * 8, zIndex: Date.now() }
    const targetPageIdx = activeSide === 'right' ? currentPageIndex + 1 : currentPageIndex
    setPagesMut(ps => { ps[targetPageIdx].images.push(img); return ps })
    setSelectedId(img.id)
    e.target.value = ''
  }

  const handleClickEmpty = (pi: number, x: number, y: number) => {
    const txt: ScrapbookText = { id: genId(), content: '', x, y, width: 40, fontSize: 14, color: '#2D3748', bold: false, italic: false, underline: false, rotation: 0, zIndex: Date.now() }
    setPagesMut(ps => { ps[pi].texts = [...(ps[pi].texts || []), txt]; return ps })
    setSelectedId(txt.id)
  }

  const nextPage = () => {
    if (currentPageIndex + 2 < pages.length) {
      setCurrentPageIndex(i => i + 2)
    } else {
      setPagesMut(ps => [...ps, { images: [], texts: [] }, { images: [], texts: [] }])
      setCurrentPageIndex(i => i + 2)
    }
    setSelectedId(null)
  }

  const prevPage = () => {
    if (currentPageIndex >= 2) { setCurrentPageIndex(i => i - 2); setSelectedId(null) }
  }

  const addPageSpread = () => {
    setPagesMut(ps => [...ps, { images: [], texts: [] }, { images: [], texts: [] }])
    setCurrentPageIndex(pages.length % 2 === 0 ? pages.length : pages.length - 1)
    setSelectedId(null)
  }

  const deleteCurrentSpread = () => {
    if (pages.length <= 2) return
    setPagesMut(ps => {
      const copy = [...ps]
      copy.splice(currentPageIndex, 2)
      return copy.length < 2 ? [...copy, { images: [], texts: [] }, { images: [], texts: [] }].slice(0, 2) : copy
    })
    setCurrentPageIndex(i => Math.max(0, i - 2))
    setDeleteConfirm(false)
    setSelectedId(null)
  }

  const totalSpreads = Math.ceil(pages.length / 2)
  const currentSpread = Math.floor(currentPageIndex / 2) + 1

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-4 px-4 h-full">
      {deleteConfirm && <DeletePageModal onConfirm={deleteCurrentSpread} onCancel={() => setDeleteConfirm(false)} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between w-full mb-6 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
          >
            <ImageIcon size={16} /> Add Image
          </button>
          <button
            onClick={() => handleClickEmpty(activeSide === 'right' ? currentPageIndex + 1 : currentPageIndex, 20, 20)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Type size={16} /> Add Text
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddImage} />
        </div>

        <div className="flex items-center gap-2">
          {/* Add spread */}
          <button
            onClick={addPageSpread}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
            title="Add new page spread"
          >
            <Plus size={15} /> Add Page
          </button>
          {/* Delete spread */}
          {pages.length > 2 && (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
              title="Delete this page spread"
            >
              <Trash2 size={15} /> Delete Page
            </button>
          )}
          {/* Navigation */}
          <button onClick={prevPage} disabled={currentPageIndex === 0} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-500 min-w-[90px] text-center">
            Spread {currentSpread} / {totalSpreads}
          </span>
          <button onClick={nextPage} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Book */}
      <div className="relative w-full flex-1 min-h-0" style={{ maxHeight: '65vh' }}>
        <div className="absolute inset-0 bg-black/10 blur-3xl rounded-[3rem] -z-10 translate-y-8" />
        <div className="absolute inset-0 flex p-3 bg-[#4a3b2b] rounded-[2rem] shadow-2xl overflow-hidden border-8" style={{ borderColor: 'var(--book-border-color, #3a2f22)' }}>
          {/* Left Page */}
          <div
            className={`flex-1 bg-[#fdfdfb] shadow-[inset_-1px_0_10px_rgba(0,0,0,0.08)] rounded-l-xl relative overflow-hidden transition-all ${
              activeSide === 'left' ? 'ring-2 ring-primary-400 ring-inset' : ''
            }`}
            onClick={() => setActiveSide('left')}
          >
            <PageCanvas
              page={leftPage}
              pageIndex={currentPageIndex}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              onUpdateImage={updateImage}
              onDeleteImage={deleteImage}
              onUpdateText={updateText}
              onDeleteText={deleteText}
              onClickEmpty={(pi, x, y) => { setActiveSide('left'); handleClickEmpty(pi, x, y) }}
            />
            <div className="absolute bottom-3 left-4 text-[10px] text-gray-300 font-serif tracking-widest pointer-events-none">{currentPageIndex + 1}</div>
            {activeSide === 'left' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary-500/80 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-sm">Active</div>
            )}
          </div>

          {/* Spine */}
          <div className="w-6 relative z-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 -translate-x-1/2" />
          </div>

          {/* Right Page */}
          <div
            className={`flex-1 bg-[#fdfdfb] shadow-[inset_1px_0_10px_rgba(0,0,0,0.08)] rounded-r-xl relative overflow-hidden transition-all ${
              activeSide === 'right' ? 'ring-2 ring-primary-400 ring-inset' : ''
            }`}
            onClick={() => setActiveSide('right')}
          >
            <PageCanvas
              page={rightPage}
              pageIndex={currentPageIndex + 1}
              selectedId={selectedId}
              onSelectId={setSelectedId}
              onUpdateImage={updateImage}
              onDeleteImage={deleteImage}
              onUpdateText={updateText}
              onDeleteText={deleteText}
              onClickEmpty={(pi, x, y) => { setActiveSide('right'); handleClickEmpty(pi, x, y) }}
            />
            <div className="absolute bottom-3 right-4 text-[10px] text-gray-300 font-serif tracking-widest pointer-events-none">{currentPageIndex + 2}</div>
            {activeSide === 'right' && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary-500/80 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-sm">Active</div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400 text-center">Click page to select it · drag to move · corner to resize · use ↺↻ to rotate images · rotate text with slider</p>
    </div>
  )
}
