<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { usersApi, orderadminApi, userAddressAPI, customerProfileApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, X } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const customer = ref(null)
const orders = ref([])
const addresses = ref([])
const loading = ref(true)
const avatarPreviewOpen = ref(false)

const orderStatusLabels = {
  1: 'pending',
  2: 'paid',
  3: 'shipped',
  4: 'delivered',
  5: 'cancelled',
}

// Mirrors App\Enums\AccountStatus (PHP backend)
const accountStatusMeta = {
  1: { label: 'Registered', color: 'gray' },
  2: { label: 'Pending Verification', color: 'yellow' },
  3: { label: 'Active', color: 'green' },
  4: { label: 'Suspended', color: 'orange' },
  5: { label: 'Deactivated', color: 'gray' },
  6: { label: 'Banned', color: 'red' },
  7: { label: 'Locked', color: 'red' },
}

function accountStatusLabel(value) {
  if (value === null || value === undefined) return '—'
  return accountStatusMeta[Number(value)]?.label || String(value)
}

function accountStatusColor(value) {
  if (value === null || value === undefined) return 'gray'
  return accountStatusMeta[Number(value)]?.color || 'gray'
}

const genderLabels = { 1: 'Male', 2: 'Female', 3: 'Unisex' }
const languageLabels = { 1: 'English', 2: 'Español', 3: 'Français', 4: 'Tiếng Việt' }

function orderStatusLabel(value) {
  if (value === null || value === undefined) return '—'
  return orderStatusLabels[Number(value)] || String(value)
}



function genderLabel(value) {
  if (value === null || value === undefined) return '—'
  return genderLabels[Number(value)] || '—'
}

function languageLabel(value) {
  if (value === null || value === undefined) return '—'
  return languageLabels[Number(value)] || '—'
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
    <button @click="router.push({ name: 'admin-customers' })"
      class="flex items-center gap-2 text-sm text-muted hover:text-main transition-colors">
      <ArrowLeft class="w-4 h-4" /> Back to Customers
    </button>

    <div v-if="loading" class="text-center py-20 text-muted">Loading customer...</div>

    <template v-else-if="customer">
      <!-- Header / hero card -->
      <div class="bg-card border border-app rounded-2xl p-6 shadow-luxury">
        <div class="flex items-start gap-5 flex-wrap">
          <button type="button" @click="customer.avata_url && (avatarPreviewOpen = true)"
            class="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-2xl ring-2 ring-app hover:ring-[#C6A75A] transition-all"
            :class="customer.avata_url ? 'cursor-zoom-in' : 'cursor-default'">
            <img v-if="customer.avata_url" :src="customer.avata_url" class="w-full h-full object-cover" />
            <span v-else>{{ (customer.customer_profile?.first_name || customer.name)?.charAt(0).toUpperCase() }}</span>
          </button>

          <div class="flex-1 min-w-[200px]">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl font-serif font-semibold text-main">
                {{ customer.customer_profile ? `${customer.customer_profile.first_name}
                ${customer.customer_profile.last_name}` : customer.name }}
              </h1>
              <BaseBadge v-if="customer.status !== null && customer.status !== undefined"
                :status="accountStatusColor(customer.status)" :text="accountStatusLabel(customer.status)" />
            </div>
            <div class="flex items-center gap-1.5 text-sm text-muted mt-1.5">
              <Calendar class="w-3.5 h-3.5" />
              Customer since {{ new Date(customer.created_at).toLocaleDateString() }}
            </div>

            <div class="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-sm">
              <div class="flex items-center gap-1.5 text-muted">
                <Mail class="w-4 h-4" /> {{ customer.email }}
              </div>
              <div class="flex items-center gap-1.5 text-muted">
                <Phone class="w-4 h-4" /> {{ customer.customer_profile?.phone || '—' }}
              </div>
              <div class="text-muted">Gender: <span class="text-main">{{ genderLabel(customer.customer_profile?.gender)
              }}</span></div>
              <div class="text-muted">Language: <span class="text-main">{{
                languageLabel(customer.customer_profile?.preferred_language) }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Avatar lightbox -->
      <Teleport to="body">
        <div v-if="avatarPreviewOpen" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          @click="avatarPreviewOpen = false">
          <button
            class="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            @click="avatarPreviewOpen = false">
            <X class="w-6 h-6" />
          </button>
          <img :src="customer.avata_url" class="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            @click.stop />
        </div>
      </Teleport>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3">
          <h3 class="text-sm font-semibold text-main mb-1">Personal Details</h3>
          <div class="text-sm"><span class="text-muted">Date of Birth</span>
            <p class="text-main mt-0.5">{{ customer.customer_profile?.date_of_birth ? new
              Date(customer.customer_profile.date_of_birth).toLocaleDateString() : '—' }}</p>
          </div>
          <div class="text-sm"><span class="text-muted">Note</span>
            <p class="text-main mt-0.5">{{ customer.customer_profile?.note || '—' }}</p>
          </div>
        </div>

        <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury space-y-3 lg:col-span-2">
          <h3 class="text-sm font-semibold text-main mb-1 flex items-center gap-2">
            <MapPin class="w-4 h-4 text-[#C6A75A]" /> Saved Addresses
          </h3>
          <div v-if="!addresses.length" class="text-sm text-muted">No addresses on file.</div>
          <div v-for="addr in addresses" :key="addr.id"
            class="text-sm text-muted border-t border-app pt-2 first:border-t-0 first:pt-0">
            <span class="text-main font-medium">{{ addr.label }}</span> — {{ addr.address }}, {{ addr.city }}, {{
              addr.province }} {{ addr.postal_code }}
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
              <td class="px-5 py-3.5">
                <BaseBadge :status="orderStatusLabel(order.order_status)"
                  :text="orderStatusLabel(order.order_status)" />
              </td>
              <td class="px-5 py-3.5 text-main">${{ Number(order.total_amount).toFixed(2) }}</td>
              <td class="px-5 py-3.5 text-muted">{{ new Date(order.created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>