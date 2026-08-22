<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import Modal from '@/components/admin-ui/Modal.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { staffApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-vue-next'

const toast = useToastStore()
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'last_login_at', label: 'Last Login' },
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

const form = reactive({ name: '', email: '', password: '', role: 'staff', active: 1 })
const roleOptions = [{ value: 'admin', label: 'Admin' }, { value: 'staff', label: 'Staff' }]
const statusOptions = [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }]

function resetForm() {
  form.name = ''; form.email = ''; form.password = ''; form.role = 'staff'; form.active = 1
}

const STATUS_MAP = {
  1: { status: 'inactive', label: 'Registered' },
  2: { status: 'pending', label: 'Pending' },
  3: { status: 'active', label: 'Active' },
  4: { status: 'inactive', label: 'Suspended' },
  5: { status: 'inactive', label: 'Deactivated' },
  6: { status: 'inactive', label: 'Banned' },
  7: { status: 'inactive', label: 'Locked' },
}

async function loadStaff() {
  loading.value = true
  try {
    // Fetch only admin/staff accounts, excluding regular customers
    const res = await staffApi.list({ 
      page: page.value, 
      per_page: perPage.value, 
      search: searchQuery.value, 
      roles: 'admin,staff' })

    const data = 
      res.data?.data?.original?.data ??
      res.data?.data?.data ??
      res.data?.data ?? 
      []

      rows.value = Array.isArray(data) ? data : []

      total.value = 
        res.data?.data?.data?.original?.total ??
        rows.value.length
  } catch (e) {
    console.error(error)
    toast.error('Could not load wishlists.')
    rows.value = 0
  } finally {
    loading.value = false
  }
}

function openCreate() { isEditing.value = false; resetForm(); modalOpen.value = true }
function openEdit(row) {
  isEditing.value = true
  targetId.value = row.id
  form.name = row.name
  form.email = row.email
  form.password = ''
  form.role = row.role
  form.active = row.active
  modalOpen.value = true
}
function askDelete(row) { targetId.value = row.id; confirmOpen.value = true }

async function handleSave() {
  saving.value = true
  try {
    const payload = { ...form }
    if (isEditing.value && !payload.password) delete payload.password
    if (isEditing.value) {
      await staffApi.update(targetId.value, payload)
      toast.success('Staff account updated.')
    } else {
      await staffApi.create(payload)
      toast.success('Staff account created.')
    }
    modalOpen.value = false
    loadStaff()
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to save staff account.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  deleting.value = true
  try {
    await staffApi.remove(targetId.value)
    toast.success('Staff account removed.')
    confirmOpen.value = false
    loadStaff()
  } catch (e) {
    toast.error('Failed to delete staff account.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadStaff)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
          <ShieldCheck class="w-6 h-6 text-[#C6A75A]" /> Staff Management
        </h1>
        <p class="text-sm text-muted mt-1">Manage admin and staff accounts with dashboard access.</p>
      </div>
      <BaseButton @click="openCreate"><Plus class="w-4 h-4" /> Add Staff</BaseButton>
    </div>

    <DataTable
      :columns="columns" :rows="rows" :loading="loading"
      v-model:search-query="searchQuery" v-model:page="page"
      :per-page="perPage" :total="total" search-placeholder="Search staff..."
      @search="loadStaff"
    >
      <template #cell-role="{ value }">
        <BaseBadge :status="value === 'admin' ? 'active' : 'default'" :text="value" />
      </template>

      <template #cell-active="{ value }">
        <span class="inline-flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-emerald-500': value === 3,
            'bg-amber-500': value === 2 || value === 1,
            'bg-red-500': value === 4 || value === 6 || value === 7,
            'bg-gray-500': value === 5,
          }" />
                    <BaseBadge :status="STATUS_MAP[value]?.status ?? 'inactive'" :text="STATUS_MAP[value]?.label ?? 'Unknown'" />

        </span>
        <!-- <BaseBadge :status="value ? 'active' : 'inactive'" :text="value ? 'Active' : 'Inactive'" /> -->
      </template>
      <template #cell-last_login_at="{ value }">{{ value ? new Date(value).toLocaleString() : 'Never' }}</template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1.5 justify-end">
          <button @click="openEdit(row)" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors"><Pencil class="w-4 h-4" /></button>
          <button @click="askDelete(row)" class="p-1.5 rounded-lg text-muted hover:text-[#D9534F] hover:bg-card-alt transition-colors"><Trash2 class="w-4 h-4" /></button>
        </div>
      </template>
    </DataTable>

    <Modal v-model="modalOpen" :title="isEditing ? 'Edit Staff Account' : 'Add Staff Account'" size="md">
      <form @submit.prevent="handleSave" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="sm:col-span-2">
          <BaseInput v-model="form.name" label="Full Name" required />
        </div>
        <div class="sm:col-span-2">
          <BaseInput v-model="form.email" label="Email" type="email" required />
        </div>
        <BaseInput v-model="form.password" label="Password" type="password" :placeholder="isEditing ? 'Leave blank to keep current' : ''" :required="!isEditing" />
        <BaseSelect v-model="form.role" label="Role" :options="roleOptions" />
        <BaseSelect v-model="form.active" label="Status" :options="statusOptions" />
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton :loading="saving" @click="handleSave">{{ isEditing ? 'Save Changes' : 'Create' }}</BaseButton>
      </template>
    </Modal>

    <ConfirmDialog v-model="confirmOpen" title="Remove this staff account?" message="They will immediately lose access to the dashboard." :loading="deleting" @confirm="handleDelete" />
  </div>
</template>
