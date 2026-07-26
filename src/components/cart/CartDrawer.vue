<script setup>
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-vue-next'

const cart = useCartStore()
const router = useRouter()

function goToCheckout() {
  cart.closeDrawer()
  router.push({ name: 'cart' })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="cart.drawerOpen" class="fixed inset-0 z-50" style="background: rgba(0,0,0,0.5)" @click.self="cart.closeDrawer()"></div>
    </Transition>
    <Transition name="slide">
      <aside v-if="cart.drawerOpen" class="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card z-50 flex flex-col shadow-luxury-lg">
        <div class="flex items-center justify-between px-5 py-4 border-b border-app">
          <h3 class="text-lg font-serif font-semibold text-main">Your Bag ({{ cart.itemCount }})</h3>
          <button @click="cart.closeDrawer()" class="p-1.5 rounded-lg text-muted hover:text-main hover:bg-card-alt transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5">
          <div v-if="!cart.items.length" class="h-full flex flex-col items-center justify-center text-center gap-3 text-muted">
            <ShoppingBag class="w-12 h-12 opacity-30" />
            <p class="text-sm">Your bag is empty.</p>
            <button @click="cart.closeDrawer()" class="text-sm text-[#C6A75A] hover:underline">Continue shopping</button>
          </div>

          <div v-else class="space-y-5">
            <div v-for="item in cart.items" :key="item.id" class="flex gap-3">
              <div class="w-20 h-24 rounded-xl bg-card-alt overflow-hidden shrink-0">
                <img v-if="item.product?.image" :src="item.product.image" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-main truncate">{{ item.product?.name || 'Product' }}</p>
                    <p class="text-xs text-muted mt-0.5">{{ item.variant?.color }} · {{ item.variant?.size }}</p>
                  </div>
                  <button @click="cart.removeItem(item.id)" class="text-muted hover:text-[#D9534F] transition-colors shrink-0">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <div class="flex items-center justify-between mt-auto pt-2">
                  <div class="flex items-center gap-2 border border-app rounded-lg">
                    <button @click="cart.updateQuantity(item.id, item.quantity - 1)" class="p-1.5 text-muted hover:text-main"><Minus class="w-3.5 h-3.5" /></button>
                    <span class="text-sm text-main w-5 text-center">{{ item.quantity }}</span>
                    <button @click="cart.updateQuantity(item.id, item.quantity + 1)" class="p-1.5 text-muted hover:text-main"><Plus class="w-3.5 h-3.5" /></button>
                  </div>
                  <p class="text-sm font-medium text-main">${{ (Number(item.price) * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="cart.items.length" class="border-t border-app p-5 space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted">Subtotal</span>
            <span class="text-main font-semibold text-base">${{ cart.subtotal.toFixed(2) }}</span>
          </div>
          <p class="text-xs text-muted">Shipping and taxes calculated at checkout.</p>
          <button
            @click="goToCheckout"
            class="w-full py-3.5 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] font-semibold text-sm shadow-gold hover:brightness-110 transition-all"
          >
            View Bag & Checkout
          </button>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
