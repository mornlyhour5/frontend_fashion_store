<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { orderStatusHistoryApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowLeft, History } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

const history = ref([])
const loading = ref(true)

async function loadHistory() {
  loading.value = true
  try {
    const res = await orderStatusHistoryApi.list({ order_id: route.params.id, per_page: 100, sort: '-changed_at' })
    history.value = res.data.data || res.data || []
  } catch (e) {
    toast.error('Could not load status history.')
    history.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <div class="space-y-6">
    <button @click="router.back()" class="flex items-center gap-2 text-sm text-muted hover:text-main transition-colors">
      <ArrowLeft class="w-4 h-4" /> Back
    </button>

    <div>
      <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
        <History class="w-6 h-6 text-[#C6A75A]" /> Order #{{ route.params.id }} — Status History
      </h1>
      <p class="text-sm text-muted mt-1">Full audit trail of status changes for this order.</p>
    </div>

    <div class="bg-card border border-app rounded-2xl shadow-luxury p-6">
      <div v-if="loading" class="text-center py-16 text-muted text-sm">Loading history...</div>
      <div v-else-if="!history.length" class="text-center py-16 text-muted text-sm">No status changes recorded.</div>
      <ol v-else class="relative border-l border-app ml-3 space-y-6">
        <li v-for="entry in history" :key="entry.id" class="ml-6">
          <span class="absolute -left-[7px] w-3.5 h-3.5 rounded-full bg-[#C6A75A] ring-4 ring-app"></span>
          <div class="flex items-center gap-2 flex-wrap">
            <BaseBadge :status="entry.from_status" :text="entry.from_status || 'created'" />
            <span class="text-muted text-xs">→</span>
            <BaseBadge :status="entry.to_status" :text="entry.to_status" />
          </div>
          <p class="text-xs text-muted mt-1.5">{{ new Date(entry.changed_at).toLocaleString() }} · by {{ entry.changed_by ? `User #${entry.changed_by}` : 'System' }}</p>
          <p v-if="entry.note" class="text-sm text-main mt-1.5 bg-card-alt rounded-lg px-3 py-2">{{ entry.note }}</p>
        </li>
      </ol>
    </div>
  </div>
</template>
