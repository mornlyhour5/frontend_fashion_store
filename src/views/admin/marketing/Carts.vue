<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import { cartsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ShoppingCart } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'id', label: 'Cart ID', width: '100px' },
  { key: 'user', label: 'Customer' },
  { key: 'items_count', label: 'Items' },
  { key: 'cart_total', label: 'Cart Value' },
  { key: 'updated_at', label: 'Last Updated' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

async function loadCarts() {
  loading.value = true
  try {
    const res = await cartsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load carts.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function cartTotal(row) {
  if (!row.items?.length) return 0
  return row.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
}

onMounted(loadCarts)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
        <ShoppingCart class="w-6 h-6 text-[#C6A75A]" /> Active Carts
      </h1>
      <p class="text-sm text-muted mt-1">Monitor active and abandoned shopping carts.</p>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search by customer..."
      @search="loadCarts"
    >
      <template #cell-user="{ row }">{{ row.user?.name || (row.session_id ? 'Guest' : `User #${row.user_id}`) }}</template>
      <template #cell-items_count="{ row }">{{ row.items?.length ?? 0 }}</template>
      <template #cell-cart_total="{ row }">${{ cartTotal(row).toFixed(2) }}</template>
      <template #cell-updated_at="{ value }">{{ new Date(value).toLocaleString() }}</template>
    </DataTable>
  </div>
</template>
