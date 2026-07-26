<script setup>
import { ref, onMounted } from 'vue'
import { notificationsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { Bell, CheckCheck } from 'lucide-vue-next'

const toast = useToastStore()
const notifications = ref([])
const loading = ref(true)

async function loadNotifications() {
  loading.value = true
  try {
    const res = await notificationsApi.list({ per_page: 50 })
    notifications.value = res.data.data || res.data || []
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
    await notificationsApi.update(n.id, { read_at: new Date().toISOString() })
    n.read_at = new Date().toISOString()
  } catch (e) {
    toast.error('Failed to mark as read.')
  }
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
        @click="markRead(n)"
        class="w-full text-left px-5 py-4 border-b border-app last:border-b-0 hover:bg-card-alt/60 transition-colors flex items-start gap-3"
      >
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" :class="n.read_at ? 'bg-card-alt' : 'bg-[#C6A75A]/15'">
          <Bell class="w-4 h-4" :class="n.read_at ? 'text-muted' : 'text-[#C6A75A]'" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-main">{{ n.title }}</p>
          <p class="text-sm text-muted mt-0.5">{{ n.body }}</p>
          <p class="text-xs text-muted/70 mt-1">{{ new Date(n.created_at).toLocaleString() }}</p>
        </div>
        <CheckCheck v-if="n.read_at" class="w-4 h-4 text-[#4CAF7D] shrink-0 mt-1" />
        <span v-else class="w-2 h-2 rounded-full bg-[#C6A75A] shrink-0 mt-2"></span>
      </button>
    </div>
  </div>
</template>
