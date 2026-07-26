<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import { couponUsagesApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { TicketPercent } from 'lucide-vue-next'

const toast = useToastStore()

const columns = [
  { key: 'coupon', label: 'Coupon Code' },
  { key: 'user', label: 'Customer' },
  { key: 'order_id', label: 'Order #' },
  { key: 'used_at', label: 'Used On' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

async function loadUsages() {
  loading.value = true

  try {
    const res = await couponUsagesApi.list({
      page: page.value,
      per_page: perPage.value,
      search: searchQuery.value,
    })

    // console.log('API Response:', res.data)

    // Extract data correctly
    const data =
      res.data?.data?.original?.data ??
      res.data?.data?.data ??
      res.data?.data ??
      []

    rows.value = Array.isArray(data) ? data : []

    total.value =
      res.data?.data?.original?.total ??
      rows.value.length

  } catch (error) {
    console.error(error)
    toast.error('Could not load coupon usage history.')
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch(page, loadUsages)

onMounted(loadUsages)
</script>

<template>
  <div class="space-y-6">

    <div>
      <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
        <TicketPercent class="w-6 h-6 text-[#C6A75A]" />
        Coupon Usage Log
      </h1>

      <p class="text-sm text-muted mt-1">
        Track redemption history across all discount codes.
      </p>
    </div>

    <DataTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :total="total"
      :per-page="perPage"
      v-model:search-query="searchQuery"
      v-model:page="page"
      search-placeholder="Search by code or customer..."
      @search="loadUsages"
    >
      <template #cell-coupon="{ row }">
        <span class="font-mono text-[#C6A75A] font-medium">
          {{ row.coupon?.code || `#${row.coupon_id}` }}
        </span>
      </template>

      <template #cell-user="{ row }">
        {{ row.user?.name || `User #${row.user_id}` }}
      </template>

      <template #cell-order_id="{ value }">
        #{{ value }}
      </template>

      <template #cell-used_at="{ value }">
        {{ value ? new Date(value).toLocaleString() : '-' }}
      </template>

    </DataTable>

  </div>
</template>
