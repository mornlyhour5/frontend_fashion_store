<script setup>
import { ref, onMounted } from 'vue'
import { notificationsAdminApi, notificationReadApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Bell, CheckCheck, X, User, Tag, Clock } from 'lucide-vue-next'
import Modal from '@/components/admin-ui/Modal.vue'

const toast = useToastStore()
const notifications = ref([])
const loading = ref(true)

const selected = ref(null)
const showModal = ref(false)

async function loadNotifications() {
  loading.value = true
  try {
    const res = await notificationsAdminApi.list({ per_page: 20 })
    const payload = res.data?.data ?? res.data
    notifications.value = Array.isArray(payload) ? payload : (payload?.data ?? [])
  } catch (e) {
    toast.error('Could not load notifications.')
    notifications.value = []
  } finally {
    loading.value = false
  }
}

async function markRead(n) {
  if (n.read_at) return
  try {
    await notificationReadApi.update(n.id)
    n.read_at = new Date().toISOString()
  } catch (e) {
    toast.error('Failed to mark as read.')
  }
}

function parsedData(n) {
  if (!n?.data) return null
  try {
    const obj = typeof n.data === 'string' ? JSON.parse(n.data) : n.data
    return obj && Object.keys(obj).length ? obj : null
  } catch (e) {
    return null
  }
}

function openView(n) {
  selected.value = n
  showModal.value = true
  if (!n.read_at) markRead(n)
}

function closeView() {
  showModal.value = false
  selected.value = null
}

onMounted(loadNotifications)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main">Notifications</h1>
      <p class="text-sm text-muted mt-1">System and order notifications.</p>
    </div>

    <div class="bg-card border border-app rounded-2xl shadow-luxury overflow-hidden">
      <div v-if="loading" class="text-center py-16 text-muted text-sm">Loading...</div>
      <div v-else-if="!notifications.length" class="text-center py-16 text-muted text-sm">No notifications.</div>
      <button
        v-for="n in notifications" :key="n.id"
        @click="openView(n)"
        class="w-full text-left px-5 py-4 border-b border-app last:border-b-0 hover:bg-card-alt/60 transition-colors flex items-start gap-3"
      >
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="n.read_at ? 'bg-card-alt' : 'bg-[#C6A75A]/15'">
          <Bell class="w-4 h-4" :class="n.read_at ? 'text-muted' : 'text-[#C6A75A]'" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-main">{{ n.title }}</p>
          <p class="text-sm text-muted mt-0.5 line-clamp-1">{{ n.body }}</p>
          <p class="text-xs text-muted/70 mt-1">{{ new Date(n.created_at).toLocaleString() }}</p>
        </div>
        <CheckCheck v-if="n.read_at" class="w-4 h-4 text-[#4CAF7D] shrink-0 mt-1" />
        <span v-else class="w-2 h-2 rounded-full bg-[#ffb700] shrink-0 mt-2"></span>
      </button>
    </div>

    <!-- Detail view modal -->
    <Modal :open="showModal" @close="closeView">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
               :class="selected?.read_at ? 'bg-card-alt' : 'bg-[#C6A75A]/15'">
            <Bell class="w-4 h-4" :class="selected?.read_at ? 'text-muted' : 'text-[#C6A75A]'" />
          </div>
          <h2 class="text-lg font-serif font-semibold text-main">Notification Detail</h2>
        </div>
      </template>

      <div v-if="selected" class="space-y-5">
        <div>
          <p class="text-base font-medium text-main">{{ selected.title }}</p>
          <p class="text-sm text-muted mt-1 whitespace-pre-wrap">{{ selected.body }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex items-center gap-2 text-muted">
            <Tag class="w-3.5 h-3.5 shrink-0" />
            <span class="capitalize">{{ selected.type }}</span>
          </div>
          <div class="flex items-center gap-2 text-muted">
            <User class="w-3.5 h-3.5 shrink-0" />
            <span>User #{{ selected.user_id }}</span>
          </div>
          <div class="flex items-center gap-2 text-muted col-span-2">
            <Clock class="w-3.5 h-3.5 shrink-0" />
            <span>{{ new Date(selected.created_at).toLocaleString() }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted">Status:</span>
          <span v-if="selected.read_at" class="inline-flex items-center gap-1 text-[#4CAF7D]">
            <CheckCheck class="w-3.5 h-3.5" />
            Read {{ new Date(selected.read_at).toLocaleString() }}
          </span>
          <span v-else class="inline-flex items-center gap-1 text-[#C6A75A]">
            <span class="w-2 h-2 rounded-full bg-[#C6A75A]"></span>
            Unread
          </span>
        </div>

        <div v-if="parsedData(selected)">
          <p class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Payload</p>
          <pre class="text-xs bg-card-alt rounded-lg p-3 overflow-x-auto text-main">{{ JSON.stringify(parsedData(selected), null, 2) }}</pre>
        </div>
      </div>

      <template #footer>
        <button
          @click="closeView"
          class="px-4 py-2 text-sm rounded-lg border border-app text-muted hover:bg-card-alt transition-colors"
        >
          Close
        </button>
      </template>
    </Modal>
  </div>
</template>