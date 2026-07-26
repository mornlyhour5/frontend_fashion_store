<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { getOrderforuserApi } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Package } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const orders = ref([])
const loading = ref(true)

async function loadOrders() {
  loading.value = true
  try {
    const res = await getOrderforuserApi.list({ per_page: 20, sort: '-created_at' })
    const payload = res.data?.data ?? res.data
    orders.value = Array.isArray(payload) ? payload : (payload?.rows ?? payload?.data ?? [])
  } catch (e) {
    toast.error('Could not load your orders.')
    orders.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<template>
  <div class="bg-card border border-app rounded-2xl overflow-hidden">
    <div class="px-6 py-4 border-b border-app">
      <h3 class="font-semibold text-main">Order History</h3>
    </div>

    <div v-if="loading" class="p-10 text-center text-muted text-sm">Loading orders...</div>

    <div v-else-if="!orders.length" class="p-16 text-center">
      <Package class="w-12 h-12 text-muted opacity-30 mx-auto mb-3" />
      <p class="text-sm text-muted">You haven't placed any orders yet.</p>
    </div>

    <RouterLink
      v-for="order in orders" :key="order.id"
      :to="{ name: 'account-order-detail', params: { id: order.id } }"
      class="flex items-center justify-between px-6 py-4 border-b border-app last:border-b-0 hover:bg-card-alt/50 transition-colors"
    >
      <div>
        <p class="text-sm font-medium text-main">{{ order.order_number }}</p>
        <p class="text-xs text-muted mt-0.5">Placed {{ new Date(order.created_at).toLocaleDateString() }}</p>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-main font-medium">${{ Number(order.total_amount).toFixed(2) }}</span>
        <BaseBadge :status="order.order_status" :text="order.order_status" />
      </div>
    </RouterLink>
  </div>
</template>
