'use client'

import { useState, useTransition } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { Plus, Check, Trash2, Loader2, BookOpen } from 'lucide-react'
import './calendar-override.css'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveJournalEntry, addTodo, updateTodoStatus, deleteTodoAction } from './actions'

type Todo = { id: string; task: string; title: string; completed: boolean }
type Entry = { id: string; title?: string; content: string; mood: string; entry_date: string }
type MoodMap = { [date: string]: string }

// Expanded iPhone-style emoji moods
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

export default function DashboardClient({
  initialEntry,
  initialTodos,
  userId,
  moodMap = {}
}: {
  initialEntry: Entry | null
  initialTodos: Todo[]
  userId: string
  moodMap?: MoodMap
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const selectedDateStr = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const selectedDate = new Date(selectedDateStr + 'T12:00:00Z')

  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoTask, setNewTodoTask] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const [mood, setMood] = useState<string>(initialEntry?.mood || '')
  const [diaryTitle, setDiaryTitle] = useState(initialEntry?.title || '')
  const [content, setContent] = useState(initialEntry?.content || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleDateChange = (val: Date) => {
    const newDate = val.toISOString().split('T')[0]
    router.push(`/dashboard?date=${newDate}`)
  }

  const handleSaveEntry = async () => {
    setIsSaving(true)
    try {
      const result = await saveJournalEntry(userId, selectedDateStr, content, mood, initialEntry?.id, diaryTitle)
      if (result.success) {
        router.refresh()
      } else {
        console.error(result.message)
        alert(`Failed to save entry: ${result.message}`)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to save entry.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    if (!initialEntry?.id) {
      alert("Please save your journal entry first to attach tasks to it.")
      return
    }

    const optimisticTodo: Todo = {
      id: 'temp-' + Date.now(),
      title: newTodoTitle,
      task: newTodoTask,
      completed: false
    }
    setTodos(prev => [...prev, optimisticTodo])
    setNewTodoTitle('')
    setNewTodoTask('')
    setShowAddForm(false)

    startTransition(async () => {
      try {
        const added = await addTodo(initialEntry.id, newTodoTask || newTodoTitle, newTodoTitle)
        setTodos(prev => prev.map(t => t.id === optimisticTodo.id ? added : t))
      } catch (e) {
        console.error(e)
        setTodos(prev => prev.filter(t => t.id !== optimisticTodo.id))
      }
    })
  }

  const toggleTodo = (id: string, currentStatus: boolean) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t))
    startTransition(async () => {
      await updateTodoStatus(id, !currentStatus)
    })
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(t => t.id !== id))
    startTransition(async () => {
      await deleteTodoAction(id)
    })
  }

  // Render mood emoji on calendar tiles
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const dateStr = date.toISOString().split('T')[0]
    const dayMood = moodMap[dateStr]
    if (!dayMood) return null
    return (
      <div className="flex justify-center mt-0.5">
        <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>{dayMood}</span>
      </div>
    )
  }

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return ''
    const dateStr = date.toISOString().split('T')[0]
    const dayMood = moodMap[dateStr]
    if (dayMood) return 'has-mood-entry'
    return ''
  }

  const selectedMoodInfo = MOODS.find(m => m.emoji === mood)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full pb-8">

      {/* Left Column: Journal Entry (smaller) */}
      <div className="lg:col-span-5 glass-panel p-6 lg:p-8 flex flex-col relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Diary Header */}
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-primary-500 shrink-0" />
          <h2 className="text-xl font-serif font-semibold text-foreground">Daily Diary</h2>
        </div>

        {/* Diary Title Input */}
        <input
          type="text"
          value={diaryTitle}
          onChange={e => setDiaryTitle(e.target.value)}
          placeholder="Give today a title..."
          className="w-full px-0 py-2 mb-1 bg-transparent border-b-2 border-gray-200 focus:border-primary-400 focus:outline-none text-lg font-serif font-semibold text-foreground placeholder:text-gray-300 transition-colors"
        />
        <p className="text-gray-400 text-xs mb-4">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

        {/* How was your day / Mood */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500 mb-2">How was your day?</p>
          <div className="flex flex-wrap gap-2 bg-white/50 p-2 rounded-2xl border border-gray-100 shadow-sm">
            {MOODS.map(m => (
              <button
                key={m.emoji}
                onClick={() => setMood(m.emoji)}
                title={m.label}
                className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all duration-200 group ${mood === m.emoji ? 'bg-primary-100 scale-110 shadow-sm' : 'hover:bg-gray-50 hover:scale-105 opacity-60 hover:opacity-100'}`}
              >
                <span style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif', fontSize: '1.35rem' }}>
                  {m.emoji}
                </span>
                <span className={`text-[9px] font-medium transition-all ${mood === m.emoji ? 'text-primary-600 opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                  {m.label}
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

        {/* Journal Text */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your thoughts here..."
          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-gray-700 leading-relaxed min-h-[180px] text-sm"
        />

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end">
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

      {/* Right Column: Calendar & Todos (bigger) */}
      <div className="lg:col-span-7 flex flex-col gap-6">

        {/* Calendar Panel */}
        <div className="glass-panel p-6 flex flex-col items-center relative">
          {isPending && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}
          <Calendar
            onChange={(val) => handleDateChange(val as Date)}
            value={selectedDate}
            className="w-full border-none !bg-transparent font-sans"
            tileContent={tileContent}
            tileClassName={tileClassName}
          />
        </div>

        {/* To-Do List Panel */}
        <div className="glass-panel p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-xl text-foreground">To-do List</h3>
            <button
              onClick={() => setShowAddForm(v => !v)}
              disabled={!initialEntry}
              title={!initialEntry ? 'Save journal entry first' : 'Add task'}
              className="p-2 bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium px-3"
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>

          {/* Add task form */}
          {showAddForm && (
            <form onSubmit={handleAddTodo} className="mb-4 p-4 bg-primary-50/60 rounded-xl border border-primary-100 space-y-2">
              <div>
                <label className="text-xs font-semibold text-primary-600 mb-1 block">Task Title</label>
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={e => setNewTodoTitle(e.target.value)}
                  placeholder="e.g. Morning Routine"
                  required
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Task Description (optional)</label>
                <input
                  type="text"
                  value={newTodoTask}
                  onChange={e => setNewTodoTask(e.target.value)}
                  placeholder="e.g. Exercise for 30 minutes"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-400/40 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm px-4 py-1.5">Add</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary text-sm px-4 py-1.5">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[320px] pr-1">
            {todos.map(todo => (
              <div key={todo.id} className="p-3 rounded-xl border border-gray-100 bg-white/60 hover:bg-white/90 transition-colors group shadow-sm">
                {/* Task Title */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">
                    {todo.title || 'Task'}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {/* Checkable Item */}
                <button
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${todo.completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-300 hover:border-primary-400'}`}>
                    {todo.completed && <Check size={12} />}
                  </div>
                  <span className={`text-sm transition-all flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    {todo.task || todo.title}
                  </span>
                </button>
              </div>
            ))}
            {todos.length === 0 && (
              <p className="text-gray-400 text-center py-6 text-sm">
                {initialEntry ? 'No tasks yet. Add one above!' : 'Save your diary entry first to add tasks.'}
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
