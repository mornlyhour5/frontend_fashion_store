<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { ordersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Eye } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const toast = useToastStore()
const router = useRouter()

const columns = [
  { key: 'order_number', label: 'Order #' },
  { key: 'user', label: 'Customer' },
  { key: 'payment_status', label: 'Payment' },
  { key: 'order_status', label: 'Status' },
  { key: 'total_amount', label: 'Total' },
  { key: 'created_at', label: 'Date' },
  { key: 'actions', label: '', width: '70px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

async function loadOrders() {
  loading.value = true
  try {
    const res = await ordersApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load orders.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function viewOrder(row) {
  router.push({ name: 'admin-order-detail', params: { id: row.id } })
}

onMounted(loadOrders)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main">Orders</h1>
      <p class="text-sm text-muted mt-1">Track and manage all customer orders.</p>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search by order number..."
      @search="loadOrders"
    >
      <template #cell-order_number="{ value }">
        <span class="font-medium text-main">{{ value }}</span>
      </template>
      <template #cell-user="{ row }">{{ row.user?.name || `User #${row.user_id}` }}</template>
      <template #cell-payment_status="{ value }"><BaseBadge :status="value" :text="value" /></template>
      <template #cell-order_status="{ value }"><BaseBadge :status="value" :text="value" /></template>
      <template #cell-total_amount="{ value }">${{ Number(value).toFixed(2) }}</template>
      <template #cell-created_at="{ value }">{{ new Date(value).toLocaleDateString() }}</template>
      <template #cell-actions="{ row }">
        <button @click="viewOrder(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors">
          <Eye class="w-4 h-4" />
        </button>
      </template>
    </DataTable>
  </div>
</template>
