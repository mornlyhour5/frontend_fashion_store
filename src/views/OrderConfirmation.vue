<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { ordersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { CheckCircle2, Package, Clock, Landmark } from 'lucide-vue-next'

const route = useRoute()
const toast = useToastStore()
const order = ref(null)
const loading = ref(true)
let pollTimer = null

async function loadOrder() {
  try {
    const res = await ordersApi.get(route.params.id)
    order.value = res.data.data || res.data
  } catch (e) {
    toast.error('Could not load order details.')
  } finally {
    loading.value = false
  }
}

// Bank transfers are confirmed asynchronously by staff/admin — poll briefly
// so the page updates itself once payment_status flips to 'paid'.
function startPolling() {
  if (order.value?.payment_method !== 'bank_transfer') return
  if (order.value?.payment_status === 'paid') return
  pollTimer = setInterval(async () => {
    try {
      const res = await ordersApi.get(route.params.id)
      const fresh = res.data.data || res.data
      order.value = fresh
      if (fresh.payment_status === 'paid' && pollTimer) {
        clearInterval(pollTimer)
      }
    } catch (e) {
      // ignore transient errors, keep polling
    }
  }, 8000)
}

onMounted(async () => {
  await loadOrder()
  startPolling()
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<template>
  <MainLayout>
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <template v-if="!loading && order">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          :class="order.payment_status === 'paid' || order.payment_method === 'cod' ? 'bg-[#4CAF7D]/15' : 'bg-[#D0A94C]/15'"
        >
          <CheckCircle2 v-if="order.payment_status === 'paid' || order.payment_method === 'cod'" class="w-8 h-8 text-[#4CAF7D]" />
          <Clock v-else class="w-8 h-8 text-[#D0A94C]" />
        </div>

        <h1 class="text-2xl font-serif font-semibold text-main mb-2">
          {{ order.payment_status === 'paid' ? 'Order Confirmed!' : order.payment_method === 'cod' ? 'Order Placed!' : 'Order Received — Awaiting Payment' }}
        </h1>
        <p class="text-sm text-muted mb-8">
          <template v-if="order.payment_method === 'bank_transfer' && order.payment_status !== 'paid'">
            We'll confirm your order automatically once we receive your bank transfer. This page updates on its own.
          </template>
          <template v-else>
            Thank you for your purchase. We've sent a confirmation email with your order details.
          </template>
        </p>

        <div v-if="order.payment_method === 'bank_transfer' && order.payment_status !== 'paid'" class="bg-[#5B8FB9]/10 border border-[#5B8FB9]/30 rounded-xl p-4 text-left mb-6 flex items-start gap-3">
          <Landmark class="w-4 h-4 text-[#5B8FB9] mt-0.5 shrink-0" />
          <div class="text-sm text-main">
            <p class="font-medium">Bank Transfer Details</p>
            <p class="text-muted mt-1">Please transfer <span class="text-main font-medium">${{ Number(order.total_amount).toFixed(2) }}</span> referencing order <span class="text-main font-medium">{{ order.order_number }}</span>. Your order will confirm automatically once received.</p>
          </div>
        </div>

        <div class="bg-card border border-app rounded-2xl p-6 text-left space-y-4">
          <div class="flex items-center justify-between pb-4 border-b border-app">
            <div class="flex items-center gap-2">
              <Package class="w-4 h-4 text-[#C6A75A]" />
              <span class="font-medium text-main">{{ order.order_number }}</span>
            </div>
            <span class="text-sm text-muted">{{ new Date(order.created_at).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">Total Amount</span>
            <span class="font-semibold text-main">${{ Number(order.total_amount).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted">Payment Method</span>
            <span class="text-main capitalize">{{ order.payment_method?.replace('_', ' ') }}</span>
          </div>
          <div class="flex justify-between text-sm items-center">
            <span class="text-muted">Payment Status</span>
            <BaseBadge :status="order.payment_status" :text="order.payment_status?.replace('_', ' ') || 'pending'" />
          </div>
        </div>

        <div class="flex items-center justify-center gap-3 mt-8">
          <RouterLink :to="{ name: 'account-orders' }">
            <BaseButton variant="secondary">View My Orders</BaseButton>
          </RouterLink>
          <RouterLink to="/shop">
            <BaseButton>Continue Shopping</BaseButton>
          </RouterLink>
        </div>
      </template>

      <div v-else-if="loading" class="text-muted text-sm">Loading order...</div>
    </div>
  </MainLayout>
</template>
