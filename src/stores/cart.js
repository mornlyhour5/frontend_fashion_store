import { defineStore } from 'pinia'
import { cartsApi, cartItemsApi } from '@/api/resources'
import { useAuthStore } from './auth'
import { useToastStore } from './toast'

function getOrCreateSessionId() {
  let sid = localStorage.getItem('guest_session_id')
  if (!sid) {
    sid = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('guest_session_id', sid)
  }
  return sid
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    cartId: null,
    items: [], // [{ id, product_variant_id, quantity, price, variant: {...}, product: {...} }]
    loading: false,
    drawerOpen: false,
  }),
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: (state) => state.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0),
  },
  actions: {
    async init() {
      await this.loadOrCreateCart()
    },

    async loadOrCreateCart() {
      this.loading = true
      const auth = useAuthStore()
      try {
        const params = auth.isAuthenticated
          ? { user_id: auth.user.id }
          : { session_id: getOrCreateSessionId() }
        const res = await cartsApi.list(params)
        const carts = res.data.data || res.data || []
        let cart = carts[0]
        if (!cart) {
          const createRes = await cartsApi.create(
            auth.isAuthenticated ? { user_id: auth.user.id } : { session_id: getOrCreateSessionId() }
          )
          cart = createRes.data.data || createRes.data
        }
        this.cartId = cart.id
        this.items = cart.items || []
      } catch (e) {
        // Backend not wired yet — keep cart empty rather than crashing the UI
        this.cartId = null
        this.items = []
      } finally {
        this.loading = false
      }
    },

    /** variant: full product_variant row, product: parent product for display */
    async addItem(variant, product, quantity = 1) {
      const toast = useToastStore()
      if (!this.cartId) await this.loadOrCreateCart()

      const existing = this.items.find((i) => i.product_variant_id === variant.id)
      try {
        if (existing) {
          const res = await cartItemsApi.update(existing.id, { quantity: existing.quantity + quantity })
          const updated = res.data.data || res.data
          existing.quantity = updated.quantity
        } else {
          const res = await cartItemsApi.create({
            cart_id: this.cartId,
            product_variant_id: variant.id,
            quantity,
            price: variant.unit_price,
          })
          const created = res.data.data || res.data
          this.items.push({ ...created, variant, product })
        }
        toast.success(`${product.name} added to bag.`)
        this.drawerOpen = true
      } catch (e) {
        toast.error('Could not add item to bag.')
      }
    },

    async updateQuantity(itemId, quantity) {
      if (quantity < 1) return this.removeItem(itemId)
      try {
        await cartItemsApi.update(itemId, { quantity })
        const item = this.items.find((i) => i.id === itemId)
        if (item) item.quantity = quantity
      } catch (e) {
        useToastStore().error('Could not update quantity.')
      }
    },

    async removeItem(itemId) {
      try {
        await cartItemsApi.remove(itemId)
        this.items = this.items.filter((i) => i.id !== itemId)
      } catch (e) {
        useToastStore().error('Could not remove item.')
      }
    },

    async clearCart() {
      try {
        await Promise.all(this.items.map((i) => cartItemsApi.remove(i.id)))
        this.items = []
      } catch (e) {
        // ignore — order was likely already placed
      }
    },

    openDrawer() { this.drawerOpen = true },
    closeDrawer() { this.drawerOpen = false },
  },
})
