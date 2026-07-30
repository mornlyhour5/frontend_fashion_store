<script setup>
import { ref, computed, onMounted } from 'vue'
import StatCard from '@/components/admin-ui/StatCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import SalesLineChart from '@/components/admin-charts/SalesLineChart.vue'
import CategoryDonutChart from '@/components/admin-charts/CategoryDonutChart.vue'
import { DollarSign, ShoppingCart, Users, PackageCheck } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'
import { RouterLink } from 'vue-router'
import { usersApi, ordersApi, customerProfileApi } from '@/api/resources'

const toast = useToastStore()
const loading = ref(true)
const recentOrders = ref([])
const recentCustomer = ref([])

const stats = ref({
  revenue: '$0.00',
  fulfilled: '0',
})

const orderCount = computed(() => recentOrders.value.length)
const customerCount = computed(() => recentCustomer.value.length)

const salesLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const salesValues = ref([0, 0, 0, 0, 0, 0, 0])
const categoryLabels = ref(['Menswear', 'Womenswear', 'Accessories', 'Footwear'])
const categoryValues = ref([0, 0, 0, 0])

async function loadDashboard() {
  loading.value = true
  try {
    const [ordersRes, usersRes] = await Promise.all([
      ordersApi.list({ per_page: 6, sort: '-created_at' }),
      usersApi.list({ per_page: 1000 }),
    ])
    recentOrders.value = ordersRes.data.data || ordersRes.data || []
    recentCustomer.value = usersRes.data.data?.data || usersRes.data.data || usersRes.data || []
  } catch (e) {
    recentOrders.value = []
    recentCustomer.value = []
  } finally {
    loading.value = false
  }
} 

onMounted(loadDashboard)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Dashboard</h1>
        <p class="text-sm text-muted mt-1">Overview of your store's performance today.</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Revenue" :value="stats.revenue" :change="12.4" :icon="DollarSign" />
      <StatCard label="Orders" :value="orderCount" :change="8.1" :icon="ShoppingCart" />
      <StatCard label="Customers" :value="customerCount" :change="4.6" :icon="Users" />
      <StatCard label="Fulfilled" :value="stats.fulfilled" :change="-2.3" :icon="PackageCheck" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-card border border-app rounded-2xl p-5 shadow-luxury">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-main">Revenue — Last 7 Days</h3>
        </div>
        <SalesLineChart :labels="salesLabels" :values="salesValues" />
      </div>
      <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury">
        <h3 class="text-sm font-semibold text-main mb-4">Sales by Category</h3>
        <CategoryDonutChart :labels="categoryLabels" :values="categoryValues" />
      </div>
    </div>

    <div class="bg-card border border-app rounded-2xl shadow-luxury overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-app">
        <h3 class="text-sm font-semibold text-main">Recent Orders</h3>
        <RouterLink to="/admin/orders" class="text-xs text-[#C6A75A] hover:underline">View all</RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-app">
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Order #</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Customer</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!recentOrders.length">
              <td colspan="4" class="text-center py-12 text-muted text-sm">
                No orders yet — connect your Laravel API to populate this table.
              </td>
            </tr>
            <tr v-for="order in recentOrders" :key="order.id" class="border-b border-app last:border-b-0 hover:bg-card-alt/60 transition-colors">
              <td class="px-5 py-3.5 text-main font-medium">{{ order.order_number }}</td>
              <td class="px-5 py-3.5 text-main">{{ order.user?.name || '—' }}</td>
              <td class="px-5 py-3.5"><BaseBadge :status="order.order_status" :text="order.order_status" /></td>
              <td class="px-5 py-3.5 text-main">${{ order.total_amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>