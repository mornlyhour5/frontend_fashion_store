<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, Lock, Ban, ShieldOff, ChevronDown, X } from 'lucide-vue-next'
import Modal from '@/components/admin-ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable from '@/components/admin-ui/DataTable.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ConfirmDialog from '@/components/admin-ui/ConfirmDialog.vue'
import { usersApi, customerStatusApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { AlertTriangle } from 'lucide-vue-next'

const toast = useToastStore()
const router = useRouter()

const columns = [
  { key: 'avatar', label: '', width: '48px' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Joined' },
  { key: 'actions', label: '', width: '90px' },
]

const rows = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(15)
const searchQuery = ref('')
const loading = ref(false)

// Avatar lightbox
const avatarPreviewOpen = ref(false)
const previewAvatarUrl = ref(null)
const previewAvatarName = ref('')

function openAvatarPreview(row) {
  if (!row.avata_url) return
  previewAvatarUrl.value = row.avata_url
  previewAvatarName.value = row.name
  avatarPreviewOpen.value = true
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

async function loadUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: page.value,
      per_page: perPage.value,
      search: searchQuery.value,
    })
    rows.value = res.data.data.data
    total.value = res.data.data.total
  } catch (error) {
    console.error(error)
    toast.error('Could not load users.')
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function viewCustomer(row) {
  router.push({ name: 'admin-customer-detail', params: { id: row.id } })
}

const confirmOpen = ref(false)
const pendingAction = ref(null)
const reason = ref('')
const submitting = ref(false)

const ACTIONS = [
  { status: 4, label: 'Suspend account', icon: Lock },
  { status: 7, label: 'Lock account', icon: ShieldOff },
  { status: 6, label: 'Ban account', icon: Ban },
  { status: 3, label: 'Reactivate account', icon: Eye },
]

function requestStatusChange(row, action) {
  pendingAction.value = { row, ...action }
  reason.value = ''
  confirmOpen.value = true
}

async function confirmStatusChange() {
  if (!pendingAction.value) return
  if (pendingAction.value.status === 6 && !reason.value.trim()) {
    toast.error('A reason is required to ban an account.')
    return
  }
  submitting.value = true
  try {
    await customerStatusApi.update(pendingAction.value.row.id, {
      status: pendingAction.value.status,
      reason: reason.value || null,
    })
    toast.success(`Account ${pendingAction.value.label.toLowerCase()}d.`)
    confirmOpen.value = false
    await loadUsers()
  } catch (error) {
    toast.error(error?.response?.data?.message || 'Could not update account status.')
  } finally {
    submitting.value = false
  }
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

watch(page, loadUsers)
onMounted(loadUsers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-serif font-semibold text-main">Customers</h1>
        <p class="text-sm text-muted mt-1">View and manage customers.</p>
      </div>
    </div>

    <DataTable :columns="columns" :rows="rows" :loading="loading" :per-page="perPage" :total="total"
      search-placeholder="Search users..." v-model:search-query="searchQuery" v-model:page="page" @search="loadUsers">
      <template #cell-role="{ value }">
        <span v-if="value === 2">Staff</span>
        <span v-else-if="value === 3">Customer</span>
        <span v-else>Admin</span>
      </template>
      <template #cell-avatar="{ row }">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="openAvatarPreview(row)"
            class="w-8 h-8 rounded-full overflow-hidden border border-border shrink-0"
            :class="row.avata_url ? 'cursor-zoom-in hover:ring-2 hover:ring-[#C6A75A] transition-all' : 'cursor-default'"
          >
            <img v-if="row.avata_url" :src="row.avata_url" :alt="row.name"
              class="w-full h-full object-cover"
              @error="(e) => e.target.style.display = 'none'" />
            <div v-else
              class="w-full h-full bg-card-alt flex items-center justify-center text-xs font-medium text-muted">
              {{ getInitials(row.name) }}
            </div>
          </button>
        </div>
      </template>

      <template #cell-status="{ value }">
        <span class="inline-flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full" :class="{
            'bg-emerald-500': value === 3,
            'bg-amber-500': value === 2 || value === 1,
            'bg-red-500': value === 4 || value === 6 || value === 7,
            'bg-gray-500': value === 5,
          }" />
          <BaseBadge :status="STATUS_MAP[value]?.status ?? 'inactive'" :text="STATUS_MAP[value]?.label ?? 'Unknown'" />
        </span>
      </template>

      <template #cell-created_at="{ value }">
        {{ value ? new Date(value).toLocaleDateString() : '—' }}
      </template>

      <template #cell-actions="{ row }">
        <div class="flex items-center gap-1">
          <button @click="viewCustomer(row)"
            class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors">
            <Eye class="w-4 h-4" />
          </button>

          <div class="relative group">
            <button class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors">
              <ChevronDown class="w-4 h-4" />
            </button>
            <div
              class="hidden group-focus-within:block absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-10 py-1">
              <template v-for="(action, i) in ACTIONS.filter(a => a.status !== row.status)" :key="action.status">
                <div v-if="action.status === 6" class="my-1 border-t border-border" />
                <button @click="requestStatusChange(row, action)"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-card-alt flex items-center gap-2"
                  :class="action.status === 6 ? 'text-red-500' : 'text-main'">
                  <component :is="action.icon" class="w-3.5 h-3.5" />
                  {{ action.label }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <ConfirmDialog v-model="confirmOpen" :title="`${pendingAction?.label ?? ''}?`"
      :message="`${pendingAction?.row?.name ?? 'This user'} will ${pendingAction?.status === 3 ? 'regain' : 'lose'} access immediately.`"
      :confirm-label="pendingAction?.label" :loading="submitting" :danger="pendingAction?.status === 6"
      @confirm="confirmStatusChange" @cancel="confirmOpen = false">
      <textarea v-model="reason" placeholder="Reason (optional, visible in audit log)"
        class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm mt-2" rows="2" />
    </ConfirmDialog>

    <!-- Avatar lightbox -->
    <Teleport to="body">
      <div
        v-if="avatarPreviewOpen"
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        @click="avatarPreviewOpen = false"
      >
        <button
          class="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          @click="avatarPreviewOpen = false"
        >
          <X class="w-6 h-6" />
        </button>
        <div class="flex flex-col items-center gap-3" @click.stop>
          <img
            :src="previewAvatarUrl"
            class="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
          />
          <p class="text-white/80 text-sm">{{ previewAvatarName }}</p>
        </div>
      </div>
    </Teleport>
  </div>
</template>