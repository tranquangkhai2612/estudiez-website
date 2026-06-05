import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useData } from '../hooks/useData'
import type { NotificationItem } from '../types'

const readKey = (email: string) => `estudiez.readNotifications.${email}`

function loadReadIds(email: string): number[] {
  if (!email) return []
  try {
    const raw = localStorage.getItem(readKey(email))
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

export function NotificationBell() {
  const { currentUser } = useAuth()
  const { notifications, timetable, users } = useData()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<number[]>(() => loadReadIds(currentUser?.email ?? ''))
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setReadIds(loadReadIds(currentUser?.email ?? ''))
  }, [currentUser])

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const myNotifications = useMemo<NotificationItem[]>(() => {
    if (!currentUser) return []
    const email = currentUser.email

    if (currentUser.role === 'admin') {
      return notifications
    }

    if (currentUser.role === 'student') {
      const classId = currentUser.classId ?? ''
      return notifications.filter(
        (n) =>
          (n.audience === 'student' && n.target === email) ||
          (n.audience === 'class' && n.target === classId),
      )
    }

    if (currentUser.role === 'parent') {
      const child = users.find((u) => u.email === currentUser.childEmail)
      const childClassId = child?.classId ?? ''
      return notifications.filter(
        (n) =>
          (n.audience === 'parent' && n.target === email) ||
          (n.audience === 'class' && n.target === childClassId),
      )
    }

    // teacher
    const subject = currentUser.subject ?? ''
    const classIds = Array.from(
      new Set(timetable.filter((slot) => slot.subject === subject).map((slot) => slot.classId)),
    )
    return notifications.filter(
      (n) =>
        n.audience === 'teacher' ||
        (n.audience === 'class' && classIds.includes(n.target ?? '')),
    )
  }, [currentUser, notifications, timetable, users])

  const unreadCount = useMemo(
    () => myNotifications.filter((n) => !readIds.includes(n.id)).length,
    [myNotifications, readIds],
  )

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next && currentUser) {
      // Mark everything currently shown as read.
      const allIds = myNotifications.map((n) => n.id)
      setReadIds(allIds)
      try {
        localStorage.setItem(readKey(currentUser.email), JSON.stringify(allIds))
      } catch {
        // ignore storage failures
      }
    }
  }

  if (!currentUser) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg z-40">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {myNotifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 text-center">No notifications.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myNotifications.map((n) => (
                  <li key={n.id} className="px-4 py-3 hover:bg-slate-50">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n.sender} &middot; {n.date}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
