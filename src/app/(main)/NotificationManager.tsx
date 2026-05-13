'use client'

import { useEffect, useRef } from 'react'

export default function NotificationManager() {
  const lastNotifDate = useRef<string | null>(null)

  useEffect(() => {
    const checkNotification = () => {
      const isEnabled = localStorage.getItem('bloomly-notif-daily') !== 'false'
      const reminderTime = localStorage.getItem('bloomly-notif-time') || '20:00'
      
      if (!isEnabled) return

      const now = new Date()
      const currentDay = now.toDateString() // e.g. "Wed May 13 2026"
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      // If it's the right time and we haven't sent one today
      if (currentTime === reminderTime && lastNotifDate.current !== currentDay) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Bloomly Daily Reminder', {
            body: "Time for your daily reflection! Don't forget to journal. ✨",
            icon: '/favicon.ico'
          })
          lastNotifDate.current = currentDay
          localStorage.setItem('bloomly-last-notif-date', currentDay)
        }
      }
    }

    // Initialize lastNotifDate from localStorage to avoid repeats on page reload
    lastNotifDate.current = localStorage.getItem('bloomly-last-notif-date')

    const interval = setInterval(checkNotification, 30000) // Check every 30 seconds
    checkNotification() // Initial check

    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}
