'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookHeart, User } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookHeart },
  { href: '/profile', label: 'Profile', icon: User },
]

export function DesktopNav() {
  const pathname = usePathname()
  
  return (
    <nav className="flex-1 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
              isActive 
                ? 'bg-primary-50 text-primary-600 shadow-sm' 
                : 'text-gray-700 hover:bg-white/80 hover:text-primary-600'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  
  return (
    <>
      {navItems.map((item) => {
        if (item.label === 'Profile') return null
        
        const isActive = pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`p-2 transition-colors rounded-lg ${
              isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
            }`}
          >
            <item.icon size={20} />
          </Link>
        )
      })}
    </>
  )
}
