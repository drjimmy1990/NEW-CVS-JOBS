'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Notification = {
    id: string
    type: string
    title: string
    body: string | null
    data: any
    is_read: boolean
    created_at: string
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications?limit=10')
            const data = await res.json()
            setNotifications(data.notifications || [])
            setUnreadCount(data.unread_count || 0)
        } catch {}
    }

    const markAllRead = async () => {
        setLoading(true)
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAll: true }),
        })
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setLoading(false)
    }

    const markRead = async (id: string) => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [id] }),
        })
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return 'الآن'
        if (minutes < 60) return `${minutes} د`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} س`
        return `${Math.floor(hours / 24)} ي`
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-cream-dark/60 hover:text-cream hover:bg-navy-lighter"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -end-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] text-white font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute top-full end-0 mt-2 w-80 bg-navy-light border border-gold/10 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b border-gold/10">
                        <h3 className="text-sm font-semibold text-cream">الإشعارات</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllRead}
                                disabled={loading}
                                className="text-xs text-gold hover:text-gold-light h-7 px-2"
                            >
                                <CheckCheck className="h-3 w-3 me-1" />
                                قراءة الكل
                            </Button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-8 w-8 text-cream-dark/20 mx-auto mb-2" />
                                <p className="text-sm text-cream-dark/40">لا توجد إشعارات</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    className={`p-3 border-b border-gold/5 hover:bg-navy-lighter/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-gold/5' : ''}`}
                                    onClick={() => {
                                        if (!n.is_read) markRead(n.id)
                                    }}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-gold' : 'bg-transparent'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-cream font-medium truncate">{n.title}</p>
                                            {n.body && (
                                                <p className="text-xs text-cream-dark/50 mt-0.5 line-clamp-2">{n.body}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-cream-dark/30">{timeAgo(n.created_at)}</span>
                                                {n.data?.link && (
                                                    <Link
                                                        href={n.data.link}
                                                        className="text-[10px] text-gold hover:text-gold-light flex items-center gap-0.5"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setIsOpen(false)
                                                            if (!n.is_read) markRead(n.id)
                                                        }}
                                                    >
                                                        عرض
                                                        <ExternalLink className="h-2.5 w-2.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
