import Link from 'next/link'
import { Flower2, LogOut } from 'lucide-react'
import { logout } from '../(auth)/actions'
import { DesktopNav, MobileNav } from './Navigation'
import NotificationManager from './NotificationManager'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/40 shadow-sm z-10 m-4 p-4">
        <div className="flex items-center gap-2 text-primary-600 mb-12 px-2">
          <Flower2 className="w-8 h-8" />
          <span className="font-serif text-2xl font-bold text-foreground">Bloomly</span>
        </div>

        <DesktopNav />

        <div className="mt-auto pt-4 border-t border-gray-200/50">
          <form action={logout}>
            <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium">
              <LogOut size={20} />
              Log Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col min-h-screen relative overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between glass-panel p-4 mb-4">
          <div className="flex items-center gap-2 text-primary-600">
            <Flower2 className="w-6 h-6" />
            <span className="font-serif text-xl font-bold text-foreground">Bloomly</span>
          </div>
          <div className="flex items-center gap-2">
            <MobileNav />
            <form action={logout}>
              <button className="p-2 text-gray-600 hover:text-red-600">
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </header>

        <div className="flex-1 w-full max-w-[1600px] mx-auto h-full flex flex-col">
          {children}
        </div>
        <NotificationManager />
      </main>
    </div>
  )
}
