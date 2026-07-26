<script setup>
import { ref, onMounted } from 'vue'
import StatCard from '@/components/admin-ui/StatCard.vue'
import SalesLineChart from '@/components/admin-charts/SalesLineChart.vue'
import CategoryDonutChart from '@/components/admin-charts/CategoryDonutChart.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { DollarSign, TrendingUp, Percent, ShoppingBag } from 'lucide-vue-next'

const range = ref('7d')
const rangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'year', label: 'This Year' },
]

const loading = ref(false)
const salesLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const salesValues = ref([0, 0, 0, 0, 0, 0, 0])
const categoryLabels = ref(['Menswear', 'Womenswear', 'Accessories', 'Footwear'])
const categoryValues = ref([0, 0, 0, 0])

// Wire this to a real Laravel analytics endpoint, e.g. GET /api/dashboard/sales-chart?range=7d
async function loadAnalytics() {
  loading.value = true
  try {
    // placeholder — replace with dashboardApi.salesChart({ range: range.value })
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Sales Reports</h1>
        <p class="text-sm text-muted mt-1">Analyze revenue trends and performance.</p>
      </div>
      <div class="w-48">
        <BaseSelect v-model="range" :options="rangeOptions" @update:model-value="loadAnalytics" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Gross Revenue" value="$0.00" :change="0" :icon="DollarSign" />
      <StatCard label="Avg. Order Value" value="$0.00" :change="0" :icon="TrendingUp" />
      <StatCard label="Conversion Rate" value="0.0%" :change="0" :icon="Percent" />
      <StatCard label="Units Sold" value="0" :change="0" :icon="ShoppingBag" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-card border border-app rounded-2xl p-5 shadow-luxury">
        <h3 class="text-sm font-semibold text-main mb-4">Revenue Trend</h3>
        <SalesLineChart :labels="salesLabels" :values="salesValues" />
      </div>
      <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury">
        <h3 class="text-sm font-semibold text-main mb-4">Revenue by Category</h3>
        <CategoryDonutChart :labels="categoryLabels" :values="categoryValues" />
      </div>
    </div>

    <div class="bg-card border border-app rounded-2xl p-8 shadow-luxury text-center">
      <p class="text-sm text-muted">Connect this page to your Laravel analytics endpoints to populate live figures.</p>
    </div>
  </div>
</template>
