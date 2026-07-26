<script setup>
import { ref, onMounted, nextTick } from 'vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { conversationsApi, chatMessagesApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import { Send, Search, Paperclip } from 'lucide-vue-next'

const toast = useToastStore()
const auth = useAuthStore()

const conversations = ref([])
const activeConversation = ref(null)
const messages = ref([])
const messageInput = ref('')
const loadingConvos = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const search = ref('')
const messagesEl = ref(null)

async function loadConversations() {
  loadingConvos.value = true
  try {
    const res = await conversationsApi.list({ search: search.value, per_page: 50 })
    conversations.value = res.data.data || res.data || []
    if (conversations.value.length && !activeConversation.value) {
      selectConversation(conversations.value[0])
    }
  } catch (e) {
    toast.error('Could not load conversations.')
    conversations.value = []
  } finally {
    loadingConvos.value = false
  }
}

async function selectConversation(convo) {
  activeConversation.value = convo
  loadingMessages.value = true
  try {
    const res = await chatMessagesApi.list({ conversation_id: convo.id, per_page: 100 })
    messages.value = res.data.data || res.data || []
    await nextTick()
    scrollToBottom()
  } catch (e) {
    toast.error('Could not load messages.')
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function sendMessage() {
  if (!messageInput.value.trim() || !activeConversation.value) return
  sending.value = true
  const body = messageInput.value
  messageInput.value = ''
  try {
    const res = await chatMessagesApi.create({
      conversation_id: activeConversation.value.id,
      body,
      type: 'text',
      sender_role: auth.role,
    })
    messages.value.push(res.data.data || res.data)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    toast.error('Failed to send message.')
    messageInput.value = body
  } finally {
    sending.value = false
  }
}

onMounted(loadConversations)
</script>

<template>
  <div class="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main">Live Chat</h1>
      <p class="text-sm text-muted mt-1">Respond to customer support conversations.</p>
    </div>

    <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
      <!-- Conversation list -->
      <div class="bg-card border border-app rounded-2xl shadow-luxury flex flex-col overflow-hidden">
        <div class="p-3 border-b border-app">
          <div class="relative">
            <Search class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="search" @keyup.enter="loadConversations"
              placeholder="Search conversations..."
              class="w-full bg-card-alt border border-app rounded-xl pl-9 pr-3 py-2 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
            />
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="loadingConvos" class="text-center py-10 text-muted text-sm">Loading...</div>
          <div v-else-if="!conversations.length" class="text-center py-10 text-muted text-sm">No conversations found.</div>
          <button
            v-for="convo in conversations" :key="convo.id"
            @click="selectConversation(convo)"
            class="w-full text-left px-4 py-3 border-b border-app hover:bg-card-alt transition-colors"
            :class="activeConversation?.id === convo.id && 'bg-card-alt'"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-main truncate">{{ convo.subject || `Conversation #${convo.id}` }}</p>
              <BaseBadge :status="convo.status" :text="convo.status" />
            </div>
            <p class="text-xs text-muted mt-1">{{ convo.last_message_at ? new Date(convo.last_message_at).toLocaleString() : '' }}</p>
          </button>
        </div>
      </div>

      <!-- Message thread -->
      <div class="md:col-span-2 bg-card border border-app rounded-2xl shadow-luxury flex flex-col overflow-hidden">
        <template v-if="activeConversation">
          <div class="px-5 py-4 border-b border-app flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-main">{{ activeConversation.subject || `Conversation #${activeConversation.id}` }}</p>
              <p class="text-xs text-muted">Order #{{ activeConversation.order_id || '—' }}</p>
            </div>
            <BaseBadge :status="activeConversation.status" :text="activeConversation.status" />
          </div>

          <div ref="messagesEl" class="flex-1 overflow-y-auto p-5 space-y-3">
            <div v-if="loadingMessages" class="text-center py-10 text-muted text-sm">Loading messages...</div>
            <div v-else-if="!messages.length" class="text-center py-10 text-muted text-sm">No messages yet.</div>
            <div
              v-for="msg in messages" :key="msg.id"
              class="flex" :class="msg.sender_role === 'customer' ? 'justify-start' : 'justify-end'"
            >
              <div
                class="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
                :class="msg.sender_role === 'customer' ? 'bg-card-alt text-main' : 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B]'"
              >
                <p>{{ msg.body }}</p>
                <p class="text-[10px] mt-1 opacity-70">{{ new Date(msg.created_at).toLocaleTimeString() }}</p>
              </div>
            </div>
          </div>

          <div class="p-3 border-t border-app flex items-center gap-2">
            <button class="p-2 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors">
              <Paperclip class="w-4 h-4" />
            </button>
            <input
              v-model="messageInput" @keyup.enter="sendMessage"
              placeholder="Type a reply..."
              class="flex-1 bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
            />
            <button
              @click="sendMessage" :disabled="sending"
              class="p-2.5 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] disabled:opacity-50 transition-all"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>
        </template>
        <div v-else class="flex-1 flex items-center justify-center text-muted text-sm">
          Select a conversation to view messages.
        </div>
      </div>
    </div>
  </div>
</template>
