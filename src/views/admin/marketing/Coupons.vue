<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { couponsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'code', label: 'Code' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
  { key: 'usage_count', label: 'Used' },
  { key: 'is_active', label: 'Status' },
  { key: 'expires_at', label: 'Expires' },
  { key: 'actions', label: '', width: '100px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

const modalOpen = ref(false)
const confirmOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const targetId = ref(null)

const form = reactive({
  code: '', type: 'percentage', value: '', minimum_order: '', maximum_discount: '',
  usage_limit: '', is_active: 1, starts_at: '', expires_at: '', description: '',
})
const typeOptions = [{ value: 'percentage', label: 'Percentage' }, { value: 'fixed', label: 'Fixed Amount' }]
const statusOptions = [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]

function resetForm() {
  form.code = ''; form.type = 'percentage'; form.value = ''; form.minimum_order = ''
  form.maximum_discount = ''; form.usage_limit = ''; form.is_active = 1
  form.starts_at = ''; form.expires_at = ''; form.description = ''
}

async function loadCoupons() {
  loading.value = true
  try {
    const res = await couponsApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load coupons.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() { isEditing.value = false; resetForm(); modalOpen.value = true }
function openEdit(row) {
  isEditing.value = true
  targetId.value = row.id
  Object.assign(form, row)
  modalOpen.value = true
}
function askDelete(row) { targetId.value = row.id; confirmOpen.value = true }

async function handleSave() {
  saving.value = true
  try {
    if (isEditing.value) {
      await couponsApi.update(targetId.value, { ...form })
      toast.success('Coupon updated.')
    } else {
      await couponsApi.create({ ...form })
      toast.success('Coupon created.')
    }
    modalOpen.value = false
    loadCoupons()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save coupon.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await couponsApi.remove(targetId.value)
    toast.success('Coupon deleted.')
    confirmOpen.value = false
    loadCoupons()
  } catch (e) {
    toast.error('Failed to delete coupon.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadCoupons)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Coupons</h1>
        <p class="text-sm text-muted mt-1">Create and manage discount codes.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Coupon</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search by code..."
      @search="loadCoupons"
    >
      <template #cell-code="{ value }"><span class="font-mono font-medium text-[#C6A75A]">{{ value }}</span></template>
      <template #cell-value="{ row }">{{ row.type === 'percentage' ? `${row.value}%` : `$${row.value}` }}</template>
      <template #cell-is_active="{ value }">
        <BaseBadge :status="value ? 'active' : 'inactive'" :text="value ? 'Active' : 'Inactive'" />
      </template>
      <template #cell-expires_at="{ value }">{{ value ? new Date(value).toLocaleDateString() : 'No expiry' }}</template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"><Pencil class="w-4 h-4" /></button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors"><Trash2 class="w-4 h-4" /></button>
        </div>
      </template>
    </DataTable>

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Coupon' : 'Add Coupon'" size="lg">
      <form @submit.prevent="handleSave" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="form.code" label="Coupon Code" placeholder="e.g. SUMMER25" required />
        <BaseSelect v-model="form.type" label="Discount Type" :options="typeOptions" />
        <BaseInput v-model="form.value" label="Discount Value" type="number" required />
        <BaseInput v-model="form.maximum_discount" label="Max Discount ($)" type="number" />
        <BaseInput v-model="form.minimum_order" label="Minimum Order ($)" type="number" />
        <BaseInput v-model="form.usage_limit" label="Usage Limit" type="number" />
        <BaseInput v-model="form.starts_at" label="Start Date" type="date" />
        <BaseInput v-model="form.expires_at" label="Expiry Date" type="date" />
        <BaseSelect v-model="form.is_active" label="Status" :options="statusOptions" />
        <div class="sm:col-span-2 flex flex-col gap-1.5">
          <label class="text-xs font-medium text-muted uppercase tracking-wide">Description</label>
          <textarea v-model="form.description" rows="3" class="bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main outline-none focus:border-[#C6A75A] transition-colors resize-none" />
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this coupon?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>
