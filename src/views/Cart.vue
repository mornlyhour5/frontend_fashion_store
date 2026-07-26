<script setup>
import { useRouter, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-vue-next'

const cart = useCartStore()
const auth = useAuthStore()
const router = useRouter()

function proceedToCheckout() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: '/checkout' } })
    return
  }
  router.push({ name: 'checkout' })
}
</script>

<template>
  <MainLayout>
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 class="text-2xl font-serif font-semibold text-main mb-8">Shopping Bag</h1>

      <div v-if="cart.loading" class="text-center py-20 text-muted">Loading your bag...</div>

      <div v-else-if="!cart.items.length" class="text-center py-24">
        <ShoppingBag class="w-16 h-16 text-muted opacity-30 mx-auto mb-4" />
        <p class="text-main font-medium mb-2">Your bag is empty</p>
        <p class="text-sm text-muted mb-6">Looks like you haven't added anything yet.</p>
        <RouterLink to="/shop">
          <BaseButton>Start Shopping</BaseButton>
        </RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-4">
          <div
            v-for="item in cart.items" :key="item.id"
            class="flex gap-4 bg-card border border-app rounded-2xl p-4"
          >
            <div class="w-24 h-28 rounded-xl bg-card-alt overflow-hidden shrink-0">
              <img v-if="item.product?.image" :src="item.product.image" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0 flex flex-col">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium text-main">{{ item.product?.name || 'Product' }}</p>
                  <p class="text-sm text-muted mt-0.5">{{ item.variant?.color }} · {{ item.variant?.size }}</p>
                </div>
                <button @click="cart.removeItem(item.id)" class="text-muted hover:text-[#D9534F] transition-colors">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div class="flex items-center justify-between mt-auto pt-3">
                <div class="flex items-center gap-2 border border-app rounded-lg">
                  <button @click="cart.updateQuantity(item.id, item.quantity - 1)" class="p-2 text-muted hover:text-main"><Minus class="w-4 h-4" /></button>
                  <span class="text-sm text-main w-6 text-center">{{ item.quantity }}</span>
                  <button @click="cart.updateQuantity(item.id, item.quantity + 1)" class="p-2 text-muted hover:text-main"><Plus class="w-4 h-4" /></button>
                </div>
                <p class="font-semibold text-main">${{ (Number(item.price) * item.quantity).toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="lg:col-span-1">
          <div class="bg-card border border-app rounded-2xl p-6 sticky top-24 space-y-4">
            <h3 class="font-serif font-semibold text-lg text-main">Order Summary</h3>
            <div class="flex justify-between text-sm text-muted">
              <span>Subtotal ({{ cart.itemCount }} items)</span>
              <span class="text-main">${{ cart.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm text-muted">
              <span>Shipping</span>
              <span class="text-main">Calculated at checkout</span>
            </div>
            <div class="border-t border-app pt-4 flex justify-between font-semibold text-main text-base">
              <span>Estimated Total</span>
              <span>${{ cart.subtotal.toFixed(2) }}</span>
            </div>
            <BaseButton size="lg" class="w-full" @click="proceedToCheckout">Proceed to Checkout</BaseButton>
            <RouterLink to="/shop" class="block text-center text-sm text-muted hover:text-main transition-colors">Continue Shopping</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
