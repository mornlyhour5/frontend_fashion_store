<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { addressesadminApi, usersApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'user_id', label: 'User' },
  { key: 'recipient_name', label: 'Recipient' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'is_default', label: 'Default' },
  { key: 'actions', label: '', width: '100px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

const customer = ref([])

const modalOpen = ref(false)
const confirmOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const deleting = ref(false)
const targetId = ref(null)

const form = reactive({
  user_id: '', label: '', recipient_name: '', phone: '', address: '',
  city: '', province: '', postal_code: '', country: '', is_default: false,
})

function resetForm() {
  form.user_id = ''; form.label = ''; form.recipient_name = ''; form.phone = ''
  form.address = ''; form.city = ''; form.province = ''; form.postal_code = ''
  form.country = ''; form.is_default = false
}

async function loadAddresses() {
  loading.value = true
  try {
    const res = await addressesadminApi.list({ page: page.value, per_page: perPage.value, search: searchQuery.value })
    rows.value = res.data.data || res.data || []
    total.value = res.data.total ?? rows.value.length
  } catch (e) {
    toast.error('Could not load addresses.')
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function loadCustomer() {
  try {
    const res = await usersApi.list({ per_page: 100 })
    const data = res.data.data?.data || res.data.data || res.data || []
    customer.value = Array.isArray(data) ? data : []
  } catch (e) {
    customer.value = []
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
      await addressesadminApi.update(targetId.value, { ...form })
      toast.success('Address updated.')
    } else {
      await addressesadminApi.create({ ...form })
      toast.success('Address created.')
    }
    modalOpen.value = false
    loadAddresses()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save address.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await addressesadminApi.remove(targetId.value)
    toast.success('Address deleted.')
    confirmOpen.value = false
    loadAddresses()
  } catch (e) {
    toast.error('Failed to delete address.')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadAddresses()
  loadCustomer()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
          <MapPin class="w-6 h-6 text-[#C6A75A]" /> Addresses
        </h1>
        <p class="text-sm text-muted mt-1">All customer shipping addresses on file.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Address</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search addresses..."
      @search="loadAddresses"
    >
      <template #cell-address="{ value }"><span class="truncate block max-w-xs">{{ value }}</span></template>
      <template #cell-is_default="{ value }">
        <BaseBadge :status="value ? 'active' : 'default'" :text="value ? 'Default' : 'Standard'" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"><Pencil class="w-4 h-4" /></button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors"><Trash2 class="w-4 h-4" /></button>
        </div>
      </template>
    </DataTable>

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Address' : 'Add Address'" size="lg">
      <form @submit.prevent="handleSave" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="col-span-2">
          <BaseSelect v-model="form.user_id" label="Customer"
            :options="customer.map((p) => ({ value: p.id, label: p.name }))" required />
        </div>
        <BaseInput v-model="form.label" label="Label" placeholder="e.g. Home, Office" />
        <BaseInput v-model="form.recipient_name" label="Recipient Name" required />
        <BaseInput v-model="form.phone" label="Phone" />
        <div class="sm:col-span-2">
          <BaseInput v-model="form.address" label="Street Address" required />
        </div>
        <BaseInput v-model="form.city" label="City" />
        <BaseInput v-model="form.province" label="Province/State" />
        <BaseInput v-model="form.postal_code" label="Postal Code" />
        <BaseInput v-model="form.country" label="Country" />
        <label class="flex items-center gap-2 text-sm text-muted sm:col-span-2">
          <input type="checkbox" v-model="form.is_default" class="accent-[#C6A75A] rounded" />
          Set as default address
        </label>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Delete this address?" :loading="deleting" @confirm="handleDelete" />
  </div>
</template>