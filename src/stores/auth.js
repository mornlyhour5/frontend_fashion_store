import { defineStore } from 'pinia'
import { authApi } from '@/api/resources'
import { getCsrfCookie } from '@/api/client'

const ROLE_LABELS = { 1: 'admin', 2: 'staff', 3: 'customer' }

function normalizeRole(role) {
  return ROLE_LABELS[role] || role
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('store_user') || 'null'),
    token: localStorage.getItem('store_token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => state.user?.role || null,
    isAdmin: (state) => state.user?.role === 'admin',
    isStaff: (state) => state.user?.role === 'staff',
    isDashboardUser: (state) => state.user?.role === 'admin' || state.user?.role === 'staff',
    isCustomer: (state) => !state.user?.role || state.user?.role === 'customer',
    displayName: (state) => state.user?.name || 'Guest',
    firstName: (state) => state.user?.name?.split(' ')[0] || 'there',
  },
  actions: {
    async register(payload) {
      const res = await authApi.register({ ...payload, role: 'customer' })
      const { user, token } = res.data.data
      const normalizedUser = { ...user, role: normalizeRole(user.role) }
      this._persist(normalizedUser, token)
      return normalizedUser
    },

    async login(payload) {
      const res = await authApi.login(payload)
      const { user, token } = res.data.data

      const actualRole = normalizeRole(user.role)
      if (payload.loginAs && actualRole !== payload.loginAs) {
        throw new Error(
          `This account is registered as "${actualRole}", not "${payload.loginAs}". Please choose the correct login type.`
        )
      }

      const normalizedUser = { ...user, role: actualRole }
      this._persist(normalizedUser, token)
      return normalizedUser
    },

    async fetchProfile() {
      const res = await authApi.me()
      const raw = res.data.user || res.data.data || res.data
      this.user = { ...raw, role: normalizeRole(raw.role) }
      localStorage.setItem('store_user', JSON.stringify(this.user))
      return this.user
    },

    async updateProfile(payload) {
      const res = await authApi.updateProfile(payload)
      const raw = res.data.user || res.data.data || res.data
      this.user = { ...raw, role: normalizeRole(raw.role) }
      localStorage.setItem('store_user', JSON.stringify(this.user))
      return this.user
    },

    async uploadAvatar(file) {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await authApi.uploadAvatar(formData)
      const raw = res.data.user || res.data.data || res.data
      this.user = { ...raw, role: normalizeRole(raw.role) }
      localStorage.setItem('store_user', JSON.stringify(this.user))
      return this.user
    },

    async updatePreferences(payload) {
      const res = await authApi.updatePreferences(payload)
      const raw = res.data.user || res.data.data || res.data
      this.user = { ...raw, role: normalizeRole(raw.role) }
      localStorage.setItem('store_user', JSON.stringify(this.user))
      return this.user
    },

    async deleteAccount(payload) {
      await authApi.deleteAccount(payload)
      this._clear()
    },

    async logout() {
      try {
        await authApi.logout()
      } catch (e) {
        // ignore network errors on logout
      } finally {
        this._clear()
      }
    },

    _persist(user, token) {
      this.user = user
      this.token = token
      localStorage.setItem('store_token', token)
      localStorage.setItem('store_user', JSON.stringify(user))
    },

    _clear() {
      this.user = null
      this.token = null
      localStorage.removeItem('store_token')
      localStorage.removeItem('store_user')
    },
  },
})