<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import { productReviewsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Star, Check, X, Trash2 } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'product_id', label: 'Product' },
  { key: 'rating', label: 'Rating' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
  { key: 'actions', label: '', width: '140px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)
const confirmOpen = ref(false)
const deleting = ref(false)
const targetId = ref(null)

async function loadReviews() {
  loading.value = true
  try {
    const res = await productReviewsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load reviews.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function updateStatus(row, status) {
  try {
    await productReviewsApi.update(row.id, { status })
    toast.success(`Review ${status}.`)
    loadReviews()
  } catch (e) {
    toast.error('Failed to update review status.')
  }
}

function askDelete(row) { targetId.value = row.id; confirmOpen.value = true }
async function handleDelete() {
  deleting.value = true
  try {
    await productReviewsApi.remove(targetId.value)
    toast.success('Review deleted.')
    confirmOpen.value = false
    loadReviews()
  } catch (e) {
    toast.error('Failed to delete review.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadReviews)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main">Product Reviews</h1>
      <p class="text-sm text-muted mt-1">Moderate customer reviews before they go live.</p>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search reviews..."
      @search="loadReviews"
    >
      <template #cell-rating="{ value }">
        <div class="flex items-center gap-0.5">
          <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5" :class="i <= value ? 'text-[#C6A75A] fill-[#C6A75A]' : 'text-muted'" />
        </div>
      </template>
      <template #cell-status="{ value }">
        <BaseBadge :status="value" :text="value" />
      </template>
      <template #cell-created_at="{ value }">{{ new Date(value).toLocaleDateString() }}</template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1 justify-end">
          <button v-if="row.status !== 'approved'" @click="updateStatus(row, 'approved')" class="p-1.5 rounded-lg text-muted hover:text-[#4CAF7D] hover:bg-card-alt transition-colors" title="Approve">
            <Check class="w-4 h-4" />
          </button>
          <button v-if="row.status !== 'rejected'" @click="updateStatus(row, 'rejected')" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors" title="Reject">
            <X class="w-4 h-4" />
          </button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors" title="Delete">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <ConfirmDialog v-model="confirmOpen" title="Delete this review?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>
