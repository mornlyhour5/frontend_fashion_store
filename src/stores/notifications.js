import { defineStore } from 'pinia'
import { notificationsAdminApi } from '@/api/resources'
import { useAuthStore } from './auth'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    loaded: false,
  }),
  getters: {
    unreadCount: (state) => (Array.isArray(state.items) ? state.items : []).filter((n) => !n.read_at).length,
  },
  actions: {
    async init() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated) return
      try {
        const res = await notificationsAdminApi.list({ per_page: 20, sort: '-created_at' })
        const payload = res.data?.data ?? res.data
        // handle paginated shape: { data: [...], total, ... }
        this.items = Array.isArray(payload) ? payload : (payload?.data ?? [])
        this.loaded = true
      } catch (e) {
        this.items = []
      }
    },
  },
})
