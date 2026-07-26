<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ordersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, MessageSquare } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()
const order = ref(null)
const loading = ref(true)

async function loadOrder() {
  loading.value = true
  try {
    const res = await ordersApi.get(route.params.id)
    order.value = res.data.data || res.data
  } catch (e) {
    toast.error('Could not load order details.')
  } finally {
    loading.value = false
  }
}

onMounted(loadOrder)
</script>

<template>
  <div class="space-y-4">
    <button @click="router.push({ name: 'account-orders' })" class="flex items-center gap-2 text-sm text-muted hover:text-main transition-colors">
      <ArrowLeft class="w-4 h-4" /> Back to Orders
    </button>

    <div v-if="loading" class="text-center py-16 text-muted">Loading order...</div>

    <template v-else-if="order">
      <div class="bg-card border border-app rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-app flex-wrap gap-2">
          <div>
            <p class="font-semibold text-main">{{ order.order_number }}</p>
            <p class="text-xs text-muted mt-0.5">Placed on {{ new Date(order.created_at).toLocaleString() }}</p>
          </div>
          <BaseBadge :status="order.order_status" :text="order.order_status" />
        </div>

        <table class="w-full text-sm">
          <tbody>
            <tr v-for="item in order.items" :key="item.id" class="border-b border-app last:border-b-0">
              <td class="px-6 py-4">
                <p class="text-main font-medium">{{ item.product?.name || `Product #${item.product_id}` }}</p>
                <p class="text-xs text-muted mt-0.5">Qty: {{ item.quantity }}</p>
              </td>
              <td class="px-6 py-4 text-right text-main font-medium">${{ Number(item.total).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="px-6 py-4 border-t border-app space-y-1.5 text-sm">
          <div class="flex justify-between text-muted"><span>Subtotal</span><span>${{ Number(order.subtotal).toFixed(2) }}</span></div>
          <div class="flex justify-between text-muted"><span>Shipping</span><span>${{ Number(order.shipping_fee).toFixed(2) }}</span></div>
          <div class="flex justify-between font-semibold text-main text-base pt-1.5 border-t border-app mt-1.5">
            <span>Total</span><span>${{ Number(order.total_amount).toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="bg-card border border-app rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-main">Need help with this order?</p>
          <p class="text-xs text-muted mt-0.5">Chat with our support team directly.</p>
        </div>
        <RouterLink :to="{ name: 'account-support' }">
          <BaseButton variant="secondary" size="sm"><MessageSquare class="w-4 h-4" /> Contact Support</BaseButton>
        </RouterLink>
      </div>
    </template>
  </div>
</template>
