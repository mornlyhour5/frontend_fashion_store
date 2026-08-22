<script setup>
import { ref, onMounted } from 'vue'
import { notificationsUserApi, notificationReadApi } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Bell, CheckCheck, Package, Tag, MessageSquare } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()
const notifications = ref([])
const loading = ref(true)

const iconFor = (type) => ({ order: Package, promo: Tag, chat: MessageSquare }[type] || Bell)

async function loadNotifications() {
  loading.value = true
  try {
    const res = await notificationsUserApi.list({ per_page: 50, sort: '-created_at' })
    const payload = res.data?.data ?? res.data
    notifications.value = Array.isArray(payload) ? payload : (payload?.rows ?? payload?.data ?? [])
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

async function markAllRead() {
  const unread = notifications.value.filter((n) => !n.read_at)
  if (!unread.length) return
  try {
    await Promise.all(unread.map((n) => notificationsUserApi.update(n.id, { read_at: new Date().toISOString() })))
    unread.forEach((n) => { n.read_at = new Date().toISOString() })
    toast.success('All notifications marked as read.')
  } catch (e) {
    toast.error('Could not mark all as read.')
  }
}

onMounted(loadNotifications)
</script>

<template>
  <div class="bg-card border border-app rounded-2xl overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b border-app">
      <h3 class="font-semibold text-main">Notifications</h3>
      <button @click="markAllRead" class="text-xs text-[#C6A75A] hover:underline flex items-center gap-1">
        <CheckCheck class="w-3.5 h-3.5" /> Mark all as read
      </button>
    </div>

    <div v-if="loading" class="p-10 text-center text-muted text-sm">Loading...</div>
    <div v-else-if="!notifications.length" class="p-16 text-center">
      <Bell class="w-12 h-12 text-muted opacity-30 mx-auto mb-3" />
      <p class="text-sm text-muted">No notifications yet.</p>
    </div>

    <button
      v-for="n in notifications" :key="n.id"
      @click="markRead(n)"
      class="w-full text-left px-6 py-4 border-b border-app last:border-b-0 hover:bg-card-alt/50 transition-colors flex items-start gap-3"
    >
      <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="n.read_at ? 'bg-card-alt' : 'bg-[#C6A75A]/15'">
        <component :is="iconFor(n.type)" class="w-4 h-4" :class="n.read_at ? 'text-muted' : 'text-[#C6A75A]'" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-main">{{ n.title }}</p>
        <p class="text-sm text-muted mt-0.5">{{ n.body }}</p>
        <p class="text-xs text-muted/70 mt-1">{{ new Date(n.created_at).toLocaleString() }}</p>
      </div>
      <span v-if="!n.read_at" class="w-2 h-2 rounded-full bg-[#C6A75A] shrink-0 mt-2"></span>
    </button>
  </div>
</template>
