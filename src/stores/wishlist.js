import { defineStore } from 'pinia'
import { wishlistsApi, wishlistItemsApi } from '@/api/resources'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    wishlistId: null,
    items: [], // [{ id, product_id, product: {...} }]
    loading: false,
  }),
  getters: {
    productIds: (state) => new Set(state.items.map((i) => i.product_id)),
    isWishlisted: (state) => (productId) => state.items.some((i) => i.product_id === productId),
  },
  actions: {
    // Normalizes { data: [...] } | { data: { data: [...] } } | [...] shapes
    _extractList(res) {
      const payload = res?.data?.data ?? res?.data ?? []
      if (Array.isArray(payload)) return payload
      if (Array.isArray(payload?.data)) return payload.data
      return []
    },

    // Normalizes a single wishlist object out of a create response
    _extractOne(res) {
      const payload = res?.data?.data ?? res?.data ?? null
      return payload && typeof payload === 'object' ? payload : null
    },

    async init() {
      const auth = useAuthStore()
      if (!auth.isAuthenticated || !auth.user?.id) {
        // Not ready yet — don't cache a false negative, just bail silently.
        return
      }
      this.loading = true
      try {
        const res = await wishlistsApi.list()
        const lists = this._extractList(res)
        let wishlist = lists[0] ?? null

        if (!wishlist) {
          const createRes = await wishlistsApi.create({ user_id: auth.user.id })
          wishlist = this._extractOne(createRes)
        }

        if (!wishlist) {
          console.error('[wishlist] Could not resolve or create a wishlist:', res?.data)
          this.items = []
          return
        }

        this.wishlistId = wishlist.id ?? null
        this.items = Array.isArray(wishlist.items) ? wishlist.items : []
      } catch (e) {
        console.error('[wishlist] init failed:', e)
        this.items = []
      } finally {
        this.loading = false
      }
    },

    async toggle(product) {
      const auth = useAuthStore()
      const toast = useToastStore()
      if (!auth.isAuthenticated) {
        toast.info('Please sign in to save items to your wishlist.')
        return false
      }
      if (!this.wishlistId) await this.init()
      if (!this.wishlistId) {
        toast.error('Could not load your wishlist. Please try again.')
        return false
      }

      const existing = this.items.find((i) => i.product_id === product.id)
      try {
        if (existing) {
          await wishlistItemsApi.remove(existing.id)
          this.items = this.items.filter((i) => i.id !== existing.id)
          toast.info(`${product.name} removed from wishlist.`)
          return false
        } else {
          const res = await wishlistItemsApi.create({ wishlist_id: this.wishlistId, product_id: product.id })
          const created = this._extractOne(res)
          this.items.push({ ...(created ?? {}), product })
          toast.success(`${product.name} added to wishlist.`)
          return true
        }
      } catch (e) {
        toast.error('Could not update wishlist.')
        return !!existing
      }
    },
  },
})