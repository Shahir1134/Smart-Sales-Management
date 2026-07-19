import { create } from 'zustand'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'critical' | 'warning' | 'info' | 'success'
  timestamp: string
  read: boolean
}

interface NotificationStore {
  notifications: Notification[]
  addNotification: (title: string, message: string, type: 'critical' | 'warning' | 'info' | 'success') => void
  markAsRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  initialize: () => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  initialize: () => {
    const saved = localStorage.getItem('shelfsense_notifications')
    if (saved) {
      try {
        set({ notifications: JSON.parse(saved) })
      } catch {}
    } else {
      // Seed initial dummy notifications matching user's examples so the center isn't empty on first load
      const initial: Notification[] = [
        {
          id: 'init-1',
          title: 'Low Stock Alert',
          message: "Lay's Chips is running low. Current Stock: 2 units. Restock immediately.",
          type: 'critical',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toLocaleString('en-IN'),
          read: false
        },
        {
          id: 'init-2',
          title: 'Expiry Warning',
          message: 'Dove Soap expires in 8 days.',
          type: 'warning',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toLocaleString('en-IN'),
          read: false
        },
        {
          id: 'init-3',
          title: 'Sales Surge',
          message: 'Maggi sales increased by 41%.',
          type: 'success',
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toLocaleString('en-IN'),
          read: true
        },
        {
          id: 'init-4',
          title: 'Procurement Update',
          message: 'Lower supplier price found for Coca-Cola.',
          type: 'info',
          timestamp: new Date(Date.now() - 300 * 60 * 1000).toLocaleString('en-IN'),
          read: true
        }
      ]
      set({ notifications: initial })
      localStorage.setItem('shelfsense_notifications', JSON.stringify(initial))
    }
  },

  addNotification: (title, message, type) => {
    const exists = get().notifications.some(n => n.message === message)
    if (exists) return

    const newNotif: Notification = {
      id: Math.random().toString(36).substring(7),
      title,
      message,
      type,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }),
      read: false
    }
    const updated = [newNotif, ...get().notifications]
    set({ notifications: updated })
    localStorage.setItem('shelfsense_notifications', JSON.stringify(updated))
  },

  markAsRead: (id) => {
    const updated = get().notifications.map(n => n.id === id ? { ...n, read: true } : n)
    set({ notifications: updated })
    localStorage.setItem('shelfsense_notifications', JSON.stringify(updated))
  },

  markAllRead: () => {
    const updated = get().notifications.map(n => ({ ...n, read: true }))
    set({ notifications: updated })
    localStorage.setItem('shelfsense_notifications', JSON.stringify(updated))
  },

  clearAll: () => {
    set({ notifications: [] })
    localStorage.setItem('shelfsense_notifications', JSON.stringify([]))
  }
}))
