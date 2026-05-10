'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Maximize2, 
  RotateCw, 
  Move, 
  Layout as LayoutIcon,
  MousePointer2,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react'

export type ScrapbookImage = {
  id: string
  url: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  width: number // percentage
  height: number // percentage
  rotation: number
  zIndex: number
}

export type ScrapbookPage = {
  images: ScrapbookImage[]
}

interface ScrapbookProps {
  pages: ScrapbookPage[]
  onUpdatePages: (pages: ScrapbookPage[]) => void
  isEditing?: boolean
}

export default function Scrapbook({ pages: initialPages, onUpdatePages, isEditing = true }: ScrapbookProps) {
  const [pages, setPages] = useState<ScrapbookPage[]>(initialPages.length > 0 ? initialPages : [{ images: [] }, { images: [] }])
  const [currentPageIndex, setCurrentPageIndex] = useState(0) // Index of the left page
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [mode, setMode] = useState<'freeform' | 'template'>('freeform')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onUpdatePages(pages)
  }, [pages, onUpdatePages])

  const leftPage = pages[currentPageIndex]
  const rightPage = pages[currentPageIndex + 1]

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const newImage: ScrapbookImage = {
      id: Math.random().toString(36).substr(2, 9),
      url: url,
      x: 25,
      y: 25,
      width: 40,
      height: 40,
      rotation: (Math.random() - 0.5) * 10,
      zIndex: Date.now()
    }

    const newPages = [...pages]
    // Add to the page that has more space or just the left one for now
    newPages[currentPageIndex].images.push(newImage)
    setPages(newPages)
    setSelectedImageId(newImage.id)
  }

  const updateImage = (pageIndex: number, imageId: string, updates: Partial<ScrapbookImage>) => {
    const newPages = [...pages]
    newPages[pageIndex].images = newPages[pageIndex].images.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    )
    setPages(newPages)
  }

  const deleteImage = (pageIndex: number, imageId: string) => {
    const newPages = [...pages]
    newPages[pageIndex].images = newPages[pageIndex].images.filter(img => img.id !== imageId)
    setPages(newPages)
    setSelectedImageId(null)
  }

  const nextPage = () => {
    if (currentPageIndex + 2 < pages.length) {
      setCurrentPageIndex(currentPageIndex + 2)
    } else {
      // Add new pages
      setPages([...pages, { images: [] }, { images: [] }])
      setCurrentPageIndex(currentPageIndex + 2)
    }
    setSelectedImageId(null)
  }

  const prevPage = () => {
    if (currentPageIndex >= 2) {
      setCurrentPageIndex(currentPageIndex - 2)
    }
    setSelectedImageId(null)
  }

  const applyTemplate = (pageIndex: number, type: 'grid' | 'single' | 'stacked') => {
    const newPages = [...pages]
    const images = [...newPages[pageIndex].images]
    
    if (images.length === 0) return

    if (type === 'single' && images.length >= 1) {
      images[0] = { ...images[0], x: 5, y: 5, width: 90, height: 90, rotation: 0 }
    } else if (type === 'grid' && images.length >= 2) {
      images.forEach((img, i) => {
        if (i === 0) Object.assign(img, { x: 5, y: 5, width: 42.5, height: 42.5, rotation: 0 })
        if (i === 1) Object.assign(img, { x: 52.5, y: 5, width: 42.5, height: 42.5, rotation: 0 })
        if (i === 2) Object.assign(img, { x: 5, y: 52.5, width: 42.5, height: 42.5, rotation: 0 })
        if (i === 3) Object.assign(img, { x: 52.5, y: 52.5, width: 42.5, height: 42.5, rotation: 0 })
      })
    } else if (type === 'stacked') {
      images.forEach((img, i) => {
        Object.assign(img, { 
          x: 10 + (i * 5), 
          y: 10 + (i * 5), 
          width: 70, 
          height: 70, 
          rotation: (i % 2 === 0 ? 5 : -5) * (i + 1) 
        })
      })
    }

    newPages[pageIndex].images = images
    setPages(newPages)
    setMode('template')
  }

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-8 px-4 h-full">
      {/* Controls */}
      <div className="flex items-center justify-between w-full mb-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('freeform')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'freeform' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MousePointer2 size={16} />
              Freeform
            </button>
            <button 
              onClick={() => setMode('template')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'template' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <LayoutIcon size={16} />
              Templates
            </button>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-200"
          >
            <Plus size={18} />
            Add Image
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAddImage}
          />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={prevPage}
            disabled={currentPageIndex === 0}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-500 min-w-[80px] text-center">
            Pages {currentPageIndex + 1} - {currentPageIndex + 2}
          </span>
          <button 
            onClick={nextPage}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Book Container */}
      <div className="relative w-full aspect-[1.4/1] perspective-1000 mb-8 select-none">
        {/* Book shadow/glow */}
        <div className="absolute inset-0 bg-black/10 blur-3xl rounded-[3rem] -z-10 translate-y-8"></div>
        
        <div className="absolute inset-0 flex p-4 bg-[#4a3b2b] rounded-[2rem] shadow-2xl overflow-hidden border-8 border-[#3a2f22]">
          {/* Left Page */}
          <div className="flex-1 bg-[#fdfdfb] shadow-[inset_-1px_0_10px_rgba(0,0,0,0.1),-10px_0_30px_-5px_rgba(0,0,0,0.05)] rounded-l-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <PageContent 
              page={leftPage} 
              pageIndex={currentPageIndex} 
              onUpdateImage={updateImage} 
              onDeleteImage={deleteImage}
              selectedImageId={selectedImageId}
              onSelectImage={setSelectedImageId}
              mode={mode}
            />
            {/* Page number */}
            <div className="absolute bottom-4 left-6 text-[10px] text-gray-300 font-serif tracking-widest">{currentPageIndex + 1}</div>
          </div>

          {/* Spine / Crease */}
          <div className="w-8 relative z-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-y-0 left-1/2 w-px bg-black/10 -translate-x-1/2"></div>
          </div>

          {/* Right Page */}
          <div className="flex-1 bg-[#fdfdfb] shadow-[inset_1px_0_10px_rgba(0,0,0,0.1),10px_0_30px_-5px_rgba(0,0,0,0.05)] rounded-r-xl relative overflow-hidden">
             <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             <PageContent 
              page={rightPage} 
              pageIndex={currentPageIndex + 1} 
              onUpdateImage={updateImage} 
              onDeleteImage={deleteImage}
              selectedImageId={selectedImageId}
              onSelectImage={setSelectedImageId}
              mode={mode}
            />
            {/* Page number */}
            <div className="absolute bottom-4 right-6 text-[10px] text-gray-300 font-serif tracking-widest">{currentPageIndex + 2}</div>
          </div>
        </div>
      </div>

      {/* Quick Templates bar (only in template mode or always visible?) */}
      {mode === 'template' && (
        <div className="flex gap-4 p-4 bg-white/60 backdrop-blur rounded-2xl border border-white">
          <p className="text-sm font-medium text-gray-400 mr-2 flex items-center">Apply to Left:</p>
          <button onClick={() => applyTemplate(currentPageIndex, 'single')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 border-2 border-gray-200 rounded"></div></button>
          <button onClick={() => applyTemplate(currentPageIndex, 'grid')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 grid grid-cols-2 gap-0.5 border-2 border-gray-200 rounded"><div className="bg-gray-100"></div><div className="bg-gray-100"></div><div className="bg-gray-100"></div><div className="bg-gray-100"></div></div></button>
          <button onClick={() => applyTemplate(currentPageIndex, 'stacked')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 relative"><div className="absolute inset-0.5 border-2 border-gray-200 bg-white rotate-3"></div><div className="absolute inset-0.5 border-2 border-gray-200 bg-white -rotate-3"></div></div></button>
          
          <div className="w-px h-8 bg-gray-200 mx-2"></div>
          
          <p className="text-sm font-medium text-gray-400 mr-2 flex items-center">Apply to Right:</p>
          <button onClick={() => applyTemplate(currentPageIndex + 1, 'single')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 border-2 border-gray-200 rounded"></div></button>
          <button onClick={() => applyTemplate(currentPageIndex + 1, 'grid')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 grid grid-cols-2 gap-0.5 border-2 border-gray-200 rounded"><div className="bg-gray-100"></div><div className="bg-gray-100"></div><div className="bg-gray-100"></div><div className="bg-gray-100"></div></div></button>
          <button onClick={() => applyTemplate(currentPageIndex + 1, 'stacked')} className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"><div className="w-6 h-6 relative"><div className="absolute inset-0.5 border-2 border-gray-200 bg-white rotate-3"></div><div className="absolute inset-0.5 border-2 border-gray-200 bg-white -rotate-3"></div></div></button>
        </div>
      )}
    </div>
  )
}

function PageContent({ 
  page, 
  pageIndex, 
  onUpdateImage, 
  onDeleteImage, 
  selectedImageId, 
  onSelectImage,
  mode
}: { 
  page: ScrapbookPage, 
  pageIndex: number, 
  onUpdateImage: (pI: number, iI: string, u: Partial<ScrapbookImage>) => void,
  onDeleteImage: (pI: number, iI: string) => void,
  selectedImageId: string | null,
  onSelectImage: (id: string | null) => void,
  mode: 'freeform' | 'template'
}) {
  const pageRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={pageRef}
      className="absolute inset-0 p-8"
      onClick={() => onSelectImage(null)}
    >
      <AnimatePresence>
        {page.images.map((img) => (
          <ScrapbookItem 
            key={img.id}
            image={img}
            isSelected={selectedImageId === img.id}
            onSelect={(e) => { e.stopPropagation(); onSelectImage(img.id) }}
            onUpdate={(updates) => onUpdateImage(pageIndex, img.id, updates)}
            onDelete={() => onDeleteImage(pageIndex, img.id)}
            containerRef={pageRef}
            mode={mode}
          />
        ))}
      </AnimatePresence>

      {page.images.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-4 opacity-50">
          <ImageIcon size={48} strokeWidth={1} />
          <p className="font-serif italic">This page is empty...</p>
        </div>
      )}
    </div>
  )
}

function ScrapbookItem({ 
  image, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete,
  containerRef,
  mode
}: { 
  image: ScrapbookImage, 
  isSelected: boolean, 
  onSelect: (e: React.MouseEvent) => void,
  onUpdate: (u: Partial<ScrapbookImage>) => void,
  onDelete: () => void,
  containerRef: React.RefObject<HTMLDivElement>,
  mode: 'freeform' | 'template'
}) {
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const isRotating = useRef(false)

  const handleDrag = (_: any, info: any) => {
    if (mode === 'template') return
    const container = containerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    const newX = (info.point.x - container.getBoundingClientRect().left) / width * 100 - image.width / 2
    const newY = (info.point.y - container.getBoundingClientRect().top) / height * 100 - image.height / 2
    
    onUpdate({ 
      x: Math.max(0, Math.min(100 - image.width, newX)), 
      y: Math.max(0, Math.min(100 - image.height, newY)) 
    })
  }

  return (
    <motion.div
      layoutId={image.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: `${image.x}%`,
        y: `${image.y}%`,
        width: `${image.width}%`,
        height: `${image.height}%`,
        rotate: image.rotation,
        zIndex: isSelected ? 100 : 10
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`absolute cursor-move select-none p-3 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.15)] rounded-sm border border-gray-100 ${isSelected ? 'ring-2 ring-primary-400 shadow-2xl' : 'hover:shadow-xl'}`}
      onClick={onSelect}
      drag={mode === 'freeform'}
      dragMomentum={false}
      onDragStart={() => isDragging.current = true}
      onDragEnd={() => isDragging.current = false}
    >
      {/* Aesthetic Tape */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/40 backdrop-blur-sm border border-white/20 rotate-[-2deg] z-10 pointer-events-none shadow-sm"></div>

      <div className="w-full h-full relative overflow-hidden group bg-gray-50">
        <img 
          src={image.url} 
          alt="Scrapbook" 
          className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Controls Overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onMouseDown={(e) => { e.stopPropagation(); isRotating.current = true }}
                onClick={(e) => { e.stopPropagation(); onUpdate({ rotation: image.rotation + 15 }) }}
                className="p-2 bg-white text-gray-700 rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCw size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdate({ width: Math.min(90, image.width + 10), height: Math.min(90, image.height + 10) }) }}
                className="p-2 bg-white text-gray-700 rounded-xl shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {isSelected && mode === 'freeform' && (
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 rounded-full border-2 border-white cursor-nwse-resize shadow-sm"
          onMouseDown={(e) => {
            e.stopPropagation()
            // Resize logic would go here
          }}
        />
      )}
    </motion.div>
  )
}
