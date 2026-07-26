<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { ordersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, MapPin, CreditCard, Package } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const order = ref(null)
const loading = ref(true)
const updatingStatus = ref(false)
const newStatus = ref('')

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

async function loadOrder() {
  loading.value = true
  try {
    const res = await ordersApi.get(route.params.id)
    order.value = res.data.data || res.data
    newStatus.value = order.value.order_status
  } catch (e) {
    toast.error('Could not load order details.')
  } finally {
    loading.value = false
  }
}

async function updateStatus() {
  updatingStatus.value = true
  try {
    await ordersApi.update(order.value.id, { order_status: newStatus.value })
    order.value.order_status = newStatus.value
    toast.success('Order status updated.')
  } catch (e) {
    toast.error('Failed to update status.')
  } finally {
    updatingStatus.value = false
  }
}

onMounted(loadOrder)
</script>

<template>
  <div class="space-y-6">
    <button @click="router.push({ name: 'admin-orders' })" class="flex items-center gap-2 text-sm text-muted hover:text-main transition-colors">
      <ArrowLeft class="w-4 h-4" /> Back to Orders
    </button>

    <div v-if="loading" class="text-center py-20 text-muted">Loading order...</div>

    <template v-else-if="order">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-2xl font-serif font-semibold text-main">Order {{ order.order_number }}</h1>
          <p class="text-sm text-muted mt-1">Placed on {{ new Date(order.created_at).toLocaleString() }}</p>
        </div>
        <div class="flex items-center gap-3">
          <BaseBadge :status="order.order_status" :text="order.order_status" />
          <button
            @click="router.push({ name: 'admin-order-status-history', params: { id: order.id } })"
            class="text-xs text-[#C6A75A] hover:underline"
          >
            View status history
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Order items -->
        <div class="lg:col-span-2 bg-card border border-app rounded-2xl shadow-luxury overflow-hidden">
          <div class="px-5 py-4 border-b border-app flex items-center gap-2">
            <Package class="w-4 h-4 text-[#C6A75A]" />
            <h3 class="text-sm font-semibold text-main">Order Items</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-app">
                <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Item</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Qty</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Price</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!order.items?.length">
                <td colspan="4" class="text-center py-10 text-muted text-sm">No items found.</td>
              </tr>
              <tr v-for="item in order.items" :key="item.id" class="border-b border-app last:border-b-0">
                <td class="px-5 py-3.5 text-main">{{ item.product?.name || `Product #${item.product_id}` }}</td>
                <td class="px-5 py-3.5 text-main">{{ item.quantity }}</td>
                <td class="px-5 py-3.5 text-main">${{ Number(item.price).toFixed(2) }}</td>
                <td class="px-5 py-3.5 text-main font-medium">${{ Number(item.total).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="px-5 py-4 border-t border-app space-y-1.5 text-sm">
            <div class="flex justify-between text-muted"><span>Subtotal</span><span>${{ Number(order.subtotal).toFixed(2) }}</span></div>
            <div class="flex justify-between text-muted"><span>Shipping</span><span>${{ Number(order.shipping_fee).toFixed(2) }}</span></div>
            <div class="flex justify-between text-main font-semibold text-base pt-1.5 border-t border-app mt-1.5">
              <span>Total</span><span>${{ Number(order.total_amount).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3">
            <h3 class="text-sm font-semibold text-main mb-1">Update Status</h3>
            <BaseSelect v-model="newStatus" :options="statusOptions" />
            <BaseButton class="w-full" size="sm" :loading="updatingStatus" @click="updateStatus">Update</BaseButton>
          </div>

          <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3">
            <div class="flex items-center gap-2">
              <MapPin class="w-4 h-4 text-[#C6A75A]" />
              <h3 class="text-sm font-semibold text-main">Shipping Address</h3>
            </div>
            <p class="text-sm text-muted leading-relaxed">{{ order.shipping_address || 'No address on file.' }}</p>
          </div>

          <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3">
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-[#C6A75A]" />
              <h3 class="text-sm font-semibold text-main">Payment</h3>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted">Method</span>
              <span class="text-main capitalize">{{ order.payment_method || '—' }}</span>
            </div>
            <div class="flex justify-between text-sm items-center">
              <span class="text-muted">Status</span>
              <BaseBadge :status="order.payment_status" :text="order.payment_status" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
