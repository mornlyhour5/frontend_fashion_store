<script setup>
import { ref, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import { wishlistsApi, wishlistItemsApi, productVariantsApi, productImagesApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Eye } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'id', label: 'Wishlist ID', width: '120px' },
  { key: 'user', label: 'Customer' },
  { key: 'items_count', label: 'Items' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: '', width: '80px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

async function loadWishlists() {
  loading.value = true
  try {
    const res = await wishlistsApi.list({
      page: page.value,
      per_page: perPage.value,
      search: searchQuery.value
    })

    const data =
      res.data?.data?.original?.data ??
      res.data?.data?.data ??
      res.data?.data ??
      []

    rows.value = Array.isArray(data) ? data : []

    total.value =
      res.data?.data?.original?.total ??
      res.data?.data?.total ??
      res.data?.total ??
      rows.value.length
  } catch (e) {
    console.error(e)
    toast.error('Could not load wishlists.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

// --- wishlist items modal ---
const itemsModalOpen = ref(false)
const itemsLoading = ref(false)
const activeWishlist = ref(null)
const wishlistItems = ref([])

const itemColumns = [
  { key: 'image', label: 'Image', width: '60px' },
  { key: 'product', label: 'Product' },
  { key: 'price', label: 'Price' },
  { key: 'added_at', label: 'Added' },
]

async function openItems(row) {
  activeWishlist.value = row
  itemsModalOpen.value = true
  itemsLoading.value = true
  wishlistItems.value = []
  try {
    const res = await wishlistItemsApi.get(row.id)

    const data =
      res.data?.data?.original?.data ??
      res.data?.data?.data ??
      res.data?.data ??
      res.data ??
      []

    wishlistItems.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
    toast.error('Could not load wishlist items.')
    wishlistItems.value = []
  } finally {
    itemsLoading.value = false
  }
}

function imageUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  const base = import.meta.env.VITE_ASSET_URL || ''
  return `${base}/storage/${path}`
}

onMounted(loadWishlists)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main">Customer Wishlists</h1>
      <p class="text-sm text-muted mt-1">See which products customers are saving for later — useful for marketing insight.</p>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search by customer..."
      @search="loadWishlists"
    >
      <template #cell-user="{ row }">{{ row.user?.name || `User #${row.user_id}` }}</template>
      <template #cell-items_count="{ row }">{{ row.items?.length ?? row.items_count ?? 0 }}</template>
      <template #cell-created_at="{ value }">{{ new Date(value).toLocaleDateString() }}</template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end">
          <button
            @click="openItems(row)"
            class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"
            title="View items"
          >
            <Eye class="w-4 h-4" />
          </button>
        </div>
      </template>
    </DataTable>

    <Modal
      v-model="itemsModalOpen"
      :title="activeWishlist ? `Wishlist #${activeWishlist.id} — ${activeWishlist.user?.name || 'Customer'}` : 'Wishlist Items'"
      size="md"
    >
      <DataTable
        :columns="itemColumns"
        :rows="wishlistItems"
        :loading="itemsLoading"
        :total="wishlistItems.length"
        :hide-search="true"
        :hide-pagination="true"
      >
        <template #cell-image="{ row }">
          <img
            v-if="row.product?.image_url"
            :src="imageUrl(row.product.image_url)"
            :alt="row.product?.name"
            class="h-10 w-10 rounded-lg object-cover border border-border"
          />
          <div v-else class="h-10 w-10 rounded-lg border border-border bg-card-alt"></div>
        </template>
        <template #cell-product="{ row }">{{ row.product?.name || `Product #${row.product_id}` }}</template>
        <template #cell-price="{ row }">${{ Number(row.product?.price ?? 0).toFixed(2) }}</template>
        <template #cell-added_at="{ value }">{{ value ? new Date(value).toLocaleDateString() : '—' }}</template>
      </DataTable>
    </Modal>
  </div>
</template>