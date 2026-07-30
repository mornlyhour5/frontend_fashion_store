<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { ordersRecentApi } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Package, MapPin, Heart, ArrowRight, Settings } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const recentOrders = ref([])
const loading = ref(true)

async function loadRecentOrders() {
  loading.value = true
  try {
    const res = await ordersRecentApi.list({ user_id: auth.user.id, per_page: 5, sort: '-created_at' })
    recentOrders.value = res.data.data?.data || res.data.data || res.data || []
  } catch (e) {
    recentOrders.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadRecentOrders)
</script>

<template>
  <div class="space-y-6">
    <!-- Profile summary -->
    <div class="bg-card border border-app rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-xl overflow-hidden">
          <img v-if="auth.user?.avata" :src="auth.user.avata_url" class="w-full h-full object-cover" />
          <span v-else>{{ auth.firstName.charAt(0).toUpperCase() }}</span>
        </div>
        <div>
          <p class="font-medium text-main">{{ auth.displayName }}</p>
          <p class="text-sm text-muted">{{ auth.user?.email }}</p>
        </div>
      </div>
      <RouterLink to="/account/profile">
        <button class="flex items-center gap-2 px-4 py-2 rounded-xl border border-app text-sm text-main hover:border-[#C6A75A] transition-colors">
          <Settings class="w-4 h-4" /> Manage Account
        </button>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <RouterLink to="/account/orders" class="bg-card border border-app rounded-2xl p-5 hover:border-[#C6A75A]/40 transition-colors">
        <Package class="w-5 h-5 text-[#C6A75A] mb-3" />
        <p class="text-sm font-medium text-main">Orders</p>
        <p class="text-xs text-muted mt-1">Track and view order history</p>
      </RouterLink>
      <RouterLink to="/account/wishlist" class="bg-card border border-app rounded-2xl p-5 hover:border-[#C6A75A]/40 transition-colors">
        <Heart class="w-5 h-5 text-[#C6A75A] mb-3" />
        <p class="text-sm font-medium text-main">Wishlist</p>
        <p class="text-xs text-muted mt-1">Items you've saved</p>
      </RouterLink>
      <RouterLink to="/account/addresses" class="bg-card border border-app rounded-2xl p-5 hover:border-[#C6A75A]/40 transition-colors">
        <MapPin class="w-5 h-5 text-[#C6A75A] mb-3" />
        <p class="text-sm font-medium text-main">Addresses</p>
        <p class="text-xs text-muted mt-1">Manage shipping addresses</p>
      </RouterLink>
    </div>

    <div class="bg-card border border-app rounded-2xl overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-app">
        <h3 class="font-semibold text-main">Recent Orders</h3>
        <RouterLink to="/account/orders" class="text-sm text-[#C6A75A] hover:underline flex items-center gap-1">
          View all <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>
      <div v-if="loading" class="p-6 text-center text-muted text-sm">Loading...</div>
      <div v-else-if="!recentOrders.length" class="p-8 text-center text-muted text-sm">No orders yet.</div>
      <RouterLink
        v-for="order in recentOrders.filter(o => o && o.id)" :key="order.id"
        :to="{ name: 'account-order-detail', params: { id: order.id } }"
        class="flex items-center justify-between px-6 py-4 border-b border-app last:border-b-0 hover:bg-card-alt/50 transition-colors"
      >
        <div>
          <p class="text-sm font-medium text-main">{{ order.order_number }}</p>
          <p class="text-xs text-muted mt-0.5">{{ new Date(order.created_at).toLocaleDateString() }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-main">${{ Number(order.total_amount).toFixed(2) }}</span>
          <BaseBadge :status="order.order_status" :text="order.order_status" />
        </div>
      </RouterLink>
    </div>
  </div>
</template>
