'use client'

import { useState, useRef } from 'react'
import { User, Palette, Bell, Shield, Camera, Eye, EyeOff, Check } from 'lucide-react'

type Section = 'account' | 'appearance' | 'notifications' | 'privacy'

const THEMES = [
  {
    id: 'default', label: 'Bloomly', colors: ['#8B5CF6', '#F43F5E', '#10B981'], desc: 'Soft purple & rose',
    vars: { '--color-primary-50': '#F3F0FF', '--color-primary-100': '#EBE5FF', '--color-primary-500': '#8B5CF6', '--color-primary-600': '#7C3AED' }
  },
  {
    id: 'ocean', label: 'Ocean', colors: ['#0EA5E9', '#06B6D4', '#3B82F6'], desc: 'Cool blues & cyan',
    vars: { '--color-primary-50': '#F0F9FF', '--color-primary-100': '#E0F2FE', '--color-primary-500': '#0EA5E9', '--color-primary-600': '#0284C7' }
  },
  {
    id: 'forest', label: 'Forest', colors: ['#16A34A', '#65A30D', '#0D9488'], desc: 'Earthy greens',
    vars: { '--color-primary-50': '#F0FDF4', '--color-primary-100': '#DCFCE7', '--color-primary-500': '#16A34A', '--color-primary-600': '#15803D' }
  },
  {
    id: 'sunset', label: 'Sunset', colors: ['#F97316', '#EF4444', '#FBBF24'], desc: 'Warm oranges & red',
    vars: { '--color-primary-50': '#FFF7ED', '--color-primary-100': '#FFEDD5', '--color-primary-500': '#F97316', '--color-primary-600': '#EA580C' }
  },
  {
    id: 'cherry', label: 'Cherry', colors: ['#EC4899', '#F43F5E', '#A855F7'], desc: 'Pinks & fuchsia',
    vars: { '--color-primary-50': '#FDF2F8', '--color-primary-100': '#FCE7F3', '--color-primary-500': '#EC4899', '--color-primary-600': '#DB2777' }
  },
  {
    id: 'midnight', label: 'Midnight', colors: ['#6366F1', '#8B5CF6', '#A78BFA'], desc: 'Deep indigo tones',
    vars: { '--color-primary-50': '#EEF2FF', '--color-primary-100': '#E0E7FF', '--color-primary-500': '#6366F1', '--color-primary-600': '#4F46E5' }
  },
]

const SYSTEM_MODES = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'system', label: 'System', icon: '💻' },
]

export default function ProfileClient({ userEmail }: { userEmail: string }) {
  const [section, setSection] = useState<Section>('account')

  // Account
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  // Appearance
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [systemMode, setSystemMode] = useState('system')
  const [themeApplied, setThemeApplied] = useState(false)

  const handleApplyTheme = () => {
    const theme = THEMES.find(t => t.id === selectedTheme)
    if (!theme) return
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val))
    // Handle dark/light mode
    if (systemMode === 'dark') {
      root.classList.add('dark')
    } else if (systemMode === 'light') {
      root.classList.remove('dark')
    } else {
      root.classList.remove('dark')
    }
    setThemeApplied(true)
    setTimeout(() => setThemeApplied(false), 2500)
  }

  // Privacy / Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatar(url)
  }

  const handlePasswordSave = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      alert('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters.')
      return
    }
    // Here you'd call Supabase updateUser
    setPwSaved(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPwSaved(false), 3000)
  }

  const navItems = [
    { id: 'account' as Section, icon: User, label: 'Account Details' },
    { id: 'appearance' as Section, icon: Palette, label: 'Appearance' },
    { id: 'notifications' as Section, icon: Bell, label: 'Notifications' },
    { id: 'privacy' as Section, icon: Shield, label: 'Privacy & Security' },
  ]

  return (
    <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${section === item.id
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="md:col-span-8 space-y-6">

          {/* ── ACCOUNT DETAILS ─────────────────────────────────────────── */}
          {section === 'account' && (
            <>
              <div className="glass-panel p-6">
                <h3 className="text-xl font-serif font-semibold mb-6">Account Information</h3>

                {/* Avatar */}
                <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-200 to-primary-400 overflow-hidden flex items-center justify-center shrink-0 border-4 border-white shadow-md">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-white/80" />
                      )}
                    </div>
                    <button
                      onClick={() => avatarRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="Change photo"
                    >
                      <Camera size={13} />
                    </button>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{displayName || 'Your Name'}</p>
                    <p className="text-sm text-gray-500">{userEmail}</p>
                    <button
                      onClick={() => avatarRef.current?.click()}
                      className="text-xs text-primary-500 hover:text-primary-600 mt-1 font-medium transition-colors"
                    >
                      Change profile photo
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="w-full px-4 py-2 rounded-xl bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={userEmail}
                      className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Your email cannot be changed at this time.</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button className="btn-primary">Save Changes</button>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 border border-red-100/50">
                <h3 className="text-xl font-serif font-semibold mb-2 text-red-600">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors text-sm">
                  Delete Account
                </button>
              </div>
            </>
          )}

          {/* ── APPEARANCE ──────────────────────────────────────────────── */}
          {section === 'appearance' && (
            <div className="glass-panel p-6 space-y-8">
              <h3 className="text-xl font-serif font-semibold">Appearance</h3>

              {/* System Mode */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Mode</p>
                <div className="flex gap-3">
                  {SYSTEM_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSystemMode(m.id)}
                      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-medium text-sm ${systemMode === m.id
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white/60 text-gray-600 hover:border-primary-200'
                        }`}
                    >
                      <span className="text-2xl">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Color Theme</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all text-left ${selectedTheme === theme.id
                        ? 'border-primary-400 bg-primary-50/60 shadow-md'
                        : 'border-gray-200 bg-white/60 hover:border-gray-300'
                        }`}
                    >
                      {/* Color swatches */}
                      <div className="flex gap-1 mb-2">
                        {theme.colors.map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <p className="font-semibold text-sm text-foreground">{theme.label}</p>
                      <p className="text-xs text-gray-400">{theme.desc}</p>
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end items-center gap-3">
                {themeApplied && <span className="text-sm text-emerald-500 font-medium animate-pulse">✓ Theme applied!</span>}
                <button onClick={handleApplyTheme} className="btn-primary">Apply Theme</button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ───────────────────────────────────────────── */}
          {section === 'notifications' && (
            <div className="glass-panel p-6">
              <h3 className="text-xl font-serif font-semibold mb-6">Notifications</h3>
              <div className="space-y-4">
                {[
                  { label: 'Daily reminder to write', desc: 'Get a gentle nudge to journal every day' },
                  { label: 'Weekly summary', desc: 'A summary of your mood and entries' },
                  { label: 'Task reminders', desc: 'Remind me about incomplete tasks' },
                ].map(item => (
                  <label key={item.label} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary-500 rounded-full transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── PRIVACY & SECURITY ──────────────────────────────────────── */}
          {section === 'privacy' && (
            <div className="glass-panel p-6 space-y-6">
              <h3 className="text-xl font-serif font-semibold">Privacy & Security</h3>

              <div>
                <h4 className="font-semibold text-gray-700 mb-4 text-sm">Change Password</h4>
                <div className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2 pr-10 rounded-xl bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                      />
                      <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-2 pr-10 rounded-xl bg-white/50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                      />
                      <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Strength indicator */}
                    {newPassword && (
                      <div className="flex gap-1 mt-1.5">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= i * 2
                            ? newPassword.length >= 8 ? 'bg-emerald-400' : 'bg-amber-400'
                            : 'bg-gray-200'
                            }`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className={`w-full px-4 py-2 pr-10 rounded-xl bg-white/50 border focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm ${confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-300 focus:ring-red-300/50'
                          : 'border-gray-200'
                          }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button onClick={handlePasswordSave} className="btn-primary flex items-center gap-2">
                      {pwSaved && <Check size={16} />}
                      {pwSaved ? 'Password Updated!' : 'Update Password'}
                    </button>
                    {pwSaved && <span className="text-sm text-emerald-500 font-medium">✓ Saved successfully</span>}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Privacy</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Private journal', desc: 'Only you can see your entries' },
                    { label: 'Analytics & insights', desc: 'Allow anonymised usage data' },
                  ].map(item => (
                    <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary-500 rounded-full transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
