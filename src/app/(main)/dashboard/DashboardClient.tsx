'use client'

import { useState, useTransition, useCallback, useEffect, useRef } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Plus, Check, Trash2, Loader2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import './calendar-override.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveJournalEntry, addTodo, updateTodoStatus, deleteTodoAction, updateTodoTitle } from './actions'

type Todo = { id: string; title: string; completed: boolean; entry_date?: string }
type Entry = { id: string; title?: string; content: string; mood: string; entry_date: string }
type MoodMap = { [date: string]: string }

const MOODS = [
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😄', label: 'Happy' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🙂', label: 'Okay' },
  { emoji: '😐', label: 'Meh' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😫', label: 'Exhausted' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '🤒', label: 'Sick' },
  { emoji: '🥳', label: 'Excited' },
]

function parseTodo(raw: any): Todo {
  return { id: raw.id, title: raw.title || raw.task || 'Task', completed: !!raw.completed }
}

export default function DashboardClient({
  initialEntry,
  initialTodos,
  userId,
  moodMap: initialMoodMap = {}
}: {
  initialEntry: Entry | null
  initialTodos: any[]
  userId: string
  moodMap?: MoodMap
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const selectedDateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const [y, m, d] = selectedDateStr.split('-').map(Number)
  const selectedDate = new Date(y, m - 1, d)

  // ── Diary state – keyed by date so it resets when date changes ──────────
  const prevDateRef = useRef(selectedDateStr)
  const [mood, setMood] = useState<string>(initialEntry?.mood || '')
  const [diaryTitle, setDiaryTitle] = useState(initialEntry?.title || '')
  const [content, setContent] = useState(initialEntry?.content || '')
  const [savedEntryId, setSavedEntryId] = useState<string | undefined>(initialEntry?.id)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Todos state – also keyed by date ────────────────────────────────────
  const [todos, setTodos] = useState<Todo[]>(initialTodos.map(parseTodo))
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editingTodoTitle, setEditingTodoTitle] = useState('')

  const [moodMap, setMoodMap] = useState<MoodMap>(initialMoodMap)
  const [calendarActiveStart, setCalendarActiveStart] = useState<Date>(() => new Date(y, m - 1, 1))

  // When the server re-renders with new initialEntry/initialTodos (after date
  // change via router.push + router.refresh), sync client state to new props.
  useEffect(() => {
    if (prevDateRef.current === selectedDateStr) return
    prevDateRef.current = selectedDateStr

    // Reset diary fields
    setMood(initialEntry?.mood || '')
    setDiaryTitle(initialEntry?.title || '')
    setContent(initialEntry?.content || '')
    setSavedEntryId(initialEntry?.id)

    // Reset todos
    setTodos(initialTodos.map(parseTodo))
    setEditingTodoId(null)
    setEditingTodoTitle('')
  }, [selectedDateStr, initialEntry, initialTodos])

  const formatDate = (dt: Date): string => {
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }

  const handleDateChange = (val: Date) => {
    const dateStr = formatDate(val)
    router.push(`/dashboard?date=${dateStr}`)
  }

  const handleSaveEntry = async () => {
    setIsSaving(true)
    try {
      const result = await saveJournalEntry(userId, selectedDateStr, content, mood, savedEntryId, diaryTitle)
      if (result.success && result.data) {
        setSavedEntryId(result.data.id)
        if (mood) setMoodMap(prev => ({ ...prev, [selectedDateStr]: mood }))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
        router.refresh()
      } else {
        alert(`Failed to save entry: ${result.message}`)
      }
    } catch {
      alert('Failed to save entry.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddEmptyTodo = async () => {
    const optimistic: Todo = {
      id: 'temp-' + Date.now(),
      title: '',
      completed: false,
    }
    setTodos(prev => [...prev, optimistic])
    setEditingTodoId(optimistic.id)
    setEditingTodoTitle('')
  }

  const handleSaveEdit = async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim()
    if (!trimmed) {
      if (id.startsWith('temp-')) {
        setTodos(prev => prev.filter(t => t.id !== id))
      } else {
        deleteTodo(id)
      }
      setEditingTodoId(null)
      return
    }

    setTodos(prev => prev.map(t => t.id === id ? { ...t, title: trimmed } : t))
    setEditingTodoId(null)

    if (id.startsWith('temp-')) {
      startTransition(async () => {
        try {
          const added = await addTodo(userId, selectedDateStr, trimmed, [])
          setTodos(prev => prev.map(t => t.id === id ? { ...parseTodo(added), id: added.id || id } : t))
        } catch {
          setTodos(prev => prev.filter(t => t.id !== id))
        }
      })
    } else {
      startTransition(async () => {
        await updateTodoTitle(id, trimmed)
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit(id, editingTodoTitle)
    } else if (e.key === 'Escape') {
      if (id.startsWith('temp-')) setTodos(prev => prev.filter(t => t.id !== id))
      setEditingTodoId(null)
    }
  }

  const toggleTodo = (id: string, currentStatus: boolean) => {
    if (id.startsWith('temp-')) return
    const newDone = !currentStatus
    setTodos(todos.map(t => t.id === id ? { ...t, completed: newDone } : t))
    startTransition(async () => { await updateTodoStatus(id, newDone) })
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id))
    startTransition(async () => { await deleteTodoAction(id) })
  }

  const tileContent = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const ds = formatDate(date)
    const dayMood = moodMap[ds]
    if (!dayMood) return null
    return (
      <div className="calendar-emoji-day" aria-label={dayMood}>
        <span style={{ fontSize: '1rem', lineHeight: 1, display: 'block' }}>{dayMood}</span>
      </div>
    )
  }, [moodMap])

  const tileClassName = useCallback(({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    const ds = formatDate(date)
    return moodMap[ds] ? 'has-mood-entry' : ''
  }, [moodMap])

  const selectedMoodInfo = MOODS.find(mo => mo.emoji === mood)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-8">

      {/* Left: Calendar + Todos */}
      <div className="lg:col-span-7 flex flex-col gap-6">

        {/* Calendar */}
        <div className="glass-panel p-6 flex flex-col items-center relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}
          <Calendar
            onChange={(val) => handleDateChange(val as Date)}
            value={selectedDate}
            activeStartDate={calendarActiveStart}
            onActiveStartDateChange={({ activeStartDate }) => {
              if (activeStartDate) setCalendarActiveStart(activeStartDate)
            }}
            className="w-full border-none !bg-transparent font-sans"
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
        </div>

        {/* To-Do List */}
        <div className="glass-panel p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-semibold text-xl text-foreground">To-do List</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <button
              onClick={handleAddEmptyTodo}
              className="p-2 bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition-colors flex items-center gap-1 text-sm font-medium px-3"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[340px] pr-1 flex flex-col">
            {todos.length === 0 ? (
              <div className="flex items-center justify-center flex-1 min-h-[100px]">
                <p className="text-gray-400 text-center text-sm">No tasks for this day. Add one above!</p>
              </div>
            ) : (
            todos.map(todo => {
              const isEditing = editingTodoId === todo.id
              return (
                <div key={todo.id} className="rounded-xl border border-gray-100 bg-white/60 hover:bg-white/90 transition-colors group shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <button
                      onClick={() => !isEditing && toggleTodo(todo.id, todo.completed)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${todo.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 hover:border-primary-400'}`}
                    >
                      {todo.completed && <Check size={11} />}
                    </button>

                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTodoTitle}
                        onChange={e => setEditingTodoTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(todo.id, editingTodoTitle)}
                        onKeyDown={e => handleKeyDown(e, todo.id)}
                        className="flex-1 bg-transparent border-b border-primary-400 focus:outline-none text-sm font-semibold text-foreground px-1"
                      />
                    ) : (
                      <span
                        className={`flex-1 font-semibold text-sm cursor-text transition-all ${todo.completed ? 'text-gray-400 line-through' : 'text-foreground'}`}
                        onClick={() => { setEditingTodoId(todo.id); setEditingTodoTitle(todo.title) }}
                      >
                        {todo.title || 'Untitled Task'}
                      </span>
                    )}

                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })
            )}
          </div>
        </div>
      </div>

      {/* Right: Daily Diary */}
      <div className="lg:col-span-5 glass-panel p-6 lg:p-8 flex flex-col relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-5 h-5 text-primary-500 shrink-0" />
          <h2 className="text-xl font-serif font-semibold text-foreground">Daily Diary</h2>
        </div>
        <p className="text-gray-400 text-xs mb-4">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>

        {/* Mood */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-2">How was your day?</p>
          <div className="flex flex-wrap gap-2 bg-white/50 p-2 rounded-2xl border border-gray-100 shadow-sm">
            {MOODS.map(mo => (
              <button
                key={mo.emoji}
                onClick={() => setMood(mo.emoji)}
                title={mo.label}
                className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-200 group ${mood === mo.emoji ? 'bg-primary-100 scale-110 shadow-sm' : 'hover:bg-gray-50 hover:scale-105 opacity-60 hover:opacity-100'}`}
              >
                <span style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif', fontSize: '1.35rem' }}>
                  {mo.emoji}
                </span>
                <span className={`text-[9px] font-medium transition-all ${mood === mo.emoji ? 'text-primary-600 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                  {mo.label}
                </span>
              </button>
            ))}
          </div>
          {selectedMoodInfo && (
            <p className="text-xs text-primary-500 mt-2 font-medium">
              {selectedMoodInfo.emoji} Feeling {selectedMoodInfo.label}
            </p>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          value={diaryTitle}
          onChange={e => setDiaryTitle(e.target.value)}
          placeholder="Give today a title..."
          className="w-full px-0 py-2 mb-1 bg-transparent border-b-2 border-gray-200 focus:border-primary-400 focus:outline-none text-lg font-serif font-semibold text-foreground placeholder:text-gray-300 transition-colors"
        />

        {/* Thoughts */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-gray-700 leading-relaxed min-h-[180px] text-sm mt-3"
        />

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          {saveSuccess && (
            <span className="text-sm text-emerald-500 font-medium flex items-center gap-1">
              <Check size={14} /> Saved!
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSaveEntry}
              disabled={isSaving}
              className="btn-primary px-6 flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
