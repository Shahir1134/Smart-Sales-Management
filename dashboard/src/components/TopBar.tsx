import { useState, useEffect, useRef } from 'react'
import { Menu, Bell, Wifi, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle, Flame } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useNotificationStore } from '../hooks/useNotificationStore'

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/inventory':  'Inventory Monitoring',
  '/store':      'Store',
  '/sales':      'Sales Prediction',
  '/competitor': 'Competitor Analysis',
  '/assistant':  'AI Sales Assistant',
  '/reports':    'Reports',
  '/settings':   'Settings',
}

const PAGE_SUBTITLES: Record<string, string> = {
  '/':           'Live AI-powered inventory intelligence',
  '/inventory':  'YOLO + ByteTrack shelf detection',
  '/store':      'Browse all products currently available inside the retail inventory.',
  '/sales':      '30-day velocity & trend analysis',
  '/competitor': 'Tavily → Playwright → Groq pipeline',
  '/assistant':  'Groq-powered recommendations engine',
  '/reports':    'Full product metrics & export',
  '/settings':   'System configuration',
}

interface TopBarProps {
  onToggle: () => void
}

export function TopBar({ onToggle }: TopBarProps) {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'ShelfSense'
  const subtitle = PAGE_SUBTITLES[pathname] ?? ''
  
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { notifications, initialize, markAsRead, markAllRead, clearAll } = useNotificationStore()

  useEffect(() => {
    initialize()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header
      className="h-[60px] flex items-center px-5 gap-4 flex-shrink-0 z-50 relative"
      style={{
        background: 'rgba(8,11,18,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#94A3B8'
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        aria-label="Toggle sidebar"
      >
        <Menu size={15} />
      </button>

      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="font-heading font-bold text-[15px] leading-none truncate" style={{ color: '#F1F5F9' }}>
          {title}
        </h1>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: '#475569' }}>
          {subtitle}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 flex-shrink-0 relative">

        {/* Search icon removed as requested */}

        {/* Notification Bell with Unread Badge */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(prev => !prev)}
            className="relative flex w-8 h-8 rounded-lg items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: showDropdown ? '#F1F5F9' : '#6B7280'
            }}
            onMouseEnter={e => {
              if (!showDropdown) e.currentTarget.style.color = '#94A3B8'
            }}
            onMouseLeave={e => {
              if (!showDropdown) e.currentTarget.style.color = '#6B7280'
            }}
            aria-label="Notifications"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-1 animate-pulse border border-[#080B12]"
                style={{ background: '#EF4444' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-4 flex flex-col z-50"
              style={{
                background: 'rgba(10,13,20,0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.7)'
              }}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-extrabold text-[13px] text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <CheckCheck size={11} /> Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-300 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
                {notifications.length > 0 ? (
                  notifications.map(item => {
                    const iconStyle = {
                      critical: { icon: Flame,          color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
                      warning:  { icon: AlertTriangle,  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
                      success:  { icon: CheckCircle,     color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                      info:     { icon: Info,            color: '#06B6D4', bg: 'rgba(6,182,212,0.1)' }
                    }[item.type]

                    const Icon = iconStyle.icon

                    return (
                      <div
                        key={item.id}
                        onClick={() => !item.read && markAsRead(item.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border cursor-pointer hover:bg-white/[0.03] ${
                          item.read ? 'opacity-60 border-transparent' : 'border-white/[0.05]'
                        }`}
                        style={{
                          background: item.read ? 'transparent' : 'rgba(255,255,255,0.01)'
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                          style={{
                            background: iconStyle.bg,
                            borderColor: `rgba(255,255,255,0.03)`,
                            color: iconStyle.color
                          }}
                        >
                          <Icon size={14} />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-heading font-bold text-[12px] text-white truncate">
                              {item.title}
                            </span>
                            {!item.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-normal break-words">
                            {item.message}
                          </p>
                          <span className="text-[9px] font-mono-custom text-gray-600 mt-1 block">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 space-y-1.5">
                    <div className="text-2xl">🔔</div>
                    <div className="text-[11px] font-bold">All caught up!</div>
                    <div className="text-[10px] text-gray-600">No new notifications.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* System status */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <Wifi size={11} style={{ color: '#10B981' }} />
          <span className="text-[10px] font-bold tracking-wider" style={{ color: '#10B981' }}>
            ONLINE
          </span>
        </div>

        {/* Time */}
        <span className="font-mono-custom text-[11px] hidden lg:block" style={{ color: '#4B5563' }}>
          {now}
        </span>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold cursor-pointer select-none flex-shrink-0 transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #10B981, #0D9488)',
            boxShadow: '0 0 12px rgba(16,185,129,0.35)'
          }}
        >
          SS
        </div>
      </div>
    </header>
  )
}
