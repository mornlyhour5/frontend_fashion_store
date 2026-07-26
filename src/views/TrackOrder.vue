<script setup>
import { ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { ordersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Search, Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-vue-next'

const toast = useToastStore()
const orderNumber = ref('')
const email = ref('')
const loading = ref(false)
const result = ref(null)
const searched = ref(false)

const steps = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

function stepIndex(status) {
  return steps.findIndex((s) => s.key === status)
}

async function trackOrder() {
  if (!orderNumber.value.trim() || !email.value.trim()) {
    toast.error('Please enter both your order number and email.')
    return
  }
  loading.value = true
  searched.value = true
  try {
    const res = await ordersApi.list({ order_number: orderNumber.value.trim(), email: email.value.trim() })
    const found = (res.data.data || res.data || [])[0]
    result.value = found || null
    if (!found) toast.error('No order found matching those details.')
  } catch (e) {
    result.value = null
    toast.error('Could not look up your order right now.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MainLayout>
    <div class="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div class="text-center mb-10">
        <h1 class="text-2xl font-serif font-semibold text-main">Track Your Order</h1>
        <p class="text-sm text-muted mt-2">Enter your order number and email to check delivery status.</p>
      </div>

      <div class="bg-card border border-app rounded-2xl p-6 mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="orderNumber" label="Order Number" placeholder="e.g. ORD-2026-0512" @keyup.enter="trackOrder" />
          <BaseInput v-model="email" label="Email Address" type="email" placeholder="you@example.com" @keyup.enter="trackOrder" />
        </div>
        <BaseButton class="mt-4 w-full sm:w-auto" :loading="loading" @click="trackOrder">
          <Search class="w-4 h-4" /> Track Order
        </BaseButton>
      </div>

      <div v-if="searched && !loading && !result" class="text-center py-10">
        <XCircle class="w-10 h-10 text-muted opacity-30 mx-auto mb-3" />
        <p class="text-sm text-muted">No order found. Double-check your order number and email.</p>
      </div>

      <div v-if="result" class="bg-card border border-app rounded-2xl p-6 space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p class="font-semibold text-main">{{ result.order_number }}</p>
            <p class="text-xs text-muted mt-0.5">Placed {{ new Date(result.created_at).toLocaleDateString() }}</p>
          </div>
          <BaseBadge :status="result.order_status" :text="result.order_status" />
        </div>

        <!-- Progress tracker -->
        <div v-if="result.order_status !== 'cancelled'" class="flex items-center justify-between relative px-2">
          <div class="absolute top-4 left-6 right-6 h-0.5 bg-card-alt -z-0">
            <div
              class="h-full bg-gradient-to-r from-[#D0B45C] to-[#A88A42] transition-all duration-500"
              :style="{ width: `${Math.max(0, (stepIndex(result.order_status) / (steps.length - 1)) * 100)}%` }"
            />
          </div>
          <div v-for="(step, idx) in steps" :key="step.key" class="relative flex flex-col items-center gap-2 z-10 flex-1">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors"
              :class="idx <= stepIndex(result.order_status)
                ? 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] border-[#C6A75A] text-[#0B0B0B]'
                : 'bg-card border-app text-muted'"
            >
              <component :is="step.icon" class="w-4 h-4" />
            </div>
            <span class="text-[11px] text-center" :class="idx <= stepIndex(result.order_status) ? 'text-main font-medium' : 'text-muted'">{{ step.label }}</span>
          </div>
        </div>
        <div v-else class="flex items-center gap-2 p-3.5 rounded-xl bg-[#D9534F]/10 text-sm text-[#D9534F]">
          <XCircle class="w-4 h-4" /> This order was cancelled.
        </div>

        <div class="border-t border-app pt-4 flex justify-between text-sm">
          <span class="text-muted">Total Amount</span>
          <span class="font-semibold text-main">${{ Number(result.total_amount).toFixed(2) }}</span>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
