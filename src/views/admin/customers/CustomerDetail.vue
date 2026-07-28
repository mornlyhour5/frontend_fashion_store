<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { usersApi, orderadminApi, userAddressAPI, customerProfileApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, Mail, Phone, MapPin, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const customer = ref(null)
const orders = ref([])
const addresses = ref([])
const loading = ref(true)

const orderStatusLabels = {
  1: 'pending',
  2: 'paid',
  3: 'shipped',
  4: 'delivered',
  5: 'cancelled',
}

function orderStatusLabel(value) {
  if (value === null || value === undefined) return '—'
  return orderStatusLabels[Number(value)] || String(value)
}

async function loadCustomer() {
  loading.value = true
  try {
    const [userRes, ordersRes, addrRes] = await Promise.all([
      usersApi.get(route.params.id),
      orderadminApi.get(route.params.id),
      userAddressAPI.get(route.params.id),
    ])
    customer.value = userRes.data.data || userRes.data
    const ordersData = ordersRes.data.data || ordersRes.data
    orders.value = Array.isArray(ordersData) ? ordersData : (ordersData ? [ordersData] : [])
    const addrData = addrRes.data.data || addrRes.data
    addresses.value = Array.isArray(addrData) ? addrData : (addrData ? [addrData] : [])
  } catch (e) {
    toast.error('Could not load customer details.')
  } finally {
    loading.value = false
  }
}

onMounted(loadCustomer)
</script>

<template>
  <div class="space-y-6">
    <button @click="router.push({ name: 'admin-customers' })" class="flex items-center gap-2 text-sm text-muted hover:text-main transition-colors">
      <ArrowLeft class="w-4 h-4" /> Back to Customers
    </button>

    <div v-if="loading" class="text-center py-20 text-muted">Loading customer...</div>

    <template v-else-if="customer">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-2xl">
          {{ (customer.customer_profile?.first_name || customer.name)?.charAt(0).toUpperCase() }}
        </div>
        <div>
          <h1 class="text-2xl font-serif font-semibold text-main">
            {{ customer.customer_profile ? `${customer.customer_profile.first_name} ${customer.customer_profile.last_name}` : customer.name }}
          </h1>
          <p class="text-sm text-muted mt-1">Customer since {{ new Date(customer.created_at).toLocaleDateString() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3">
          <h3 class="text-sm font-semibold text-main mb-1">Contact Info</h3>
          <div class="flex items-center gap-2 text-sm text-muted"><Mail class="w-4 h-4" /> {{ customer.email }}</div>
          <div class="flex items-center gap-2 text-sm text-muted"><Phone class="w-4 h-4" /> {{ customer.customer_profile?.phone || '—' }}</div>
        </div>

        <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3 lg:col-span-2">
          <h3 class="text-sm font-semibold text-main mb-1 flex items-center gap-2">
            <MapPin class="w-4 h-4 text-[#C6A75A]" /> Saved Addresses
          </h3>
          <div v-if="!addresses.length" class="text-sm text-muted">No addresses on file.</div>
          <div v-for="addr in addresses" :key="addr.id" class="text-sm text-muted border-t border-app pt-2 first:border-t-0 first:pt-0">
            <span class="text-main font-medium">{{ addr.label }}</span> — {{ addr.address }}, {{ addr.city }}, {{ addr.province }} {{ addr.postal_code }}
          </div>
        </div>
      </div>

      <div class="bg-card border border-app rounded-2xl shadow-luxury overflow-hidden">
        <div class="px-5 py-4 border-b border-app">
          <h3 class="text-sm font-semibold text-main">Order History</h3>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-app">
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Order #</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Total</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!orders.length">
              <td colspan="4" class="text-center py-10 text-muted text-sm">No orders yet.</td>
            </tr>
            <tr v-for="order in orders.filter(Boolean)" :key="order.id" class="border-b border-app last:border-b-0">
              <td class="px-5 py-3.5 text-main font-medium">{{ order.order_number }}</td>
              <td class="px-5 py-3.5"><BaseBadge :status="orderStatusLabel(order.order_status)" :text="orderStatusLabel(order.order_status)" /></td>
              <td class="px-5 py-3.5 text-main">${{ Number(order.total_amount).toFixed(2) }}</td>
              <td class="px-5 py-3.5 text-muted">{{ new Date(order.created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>