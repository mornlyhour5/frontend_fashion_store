<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { conversationsApi, chatMessagesApi } from '@/api/resources'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { Send, MessageSquare, Plus } from 'lucide-vue-next'

const auth = useAuthStore()
const toast = useToastStore()

const conversations = ref([])
const activeConversation = ref(null)
const messages = ref([])
const messageInput = ref('')
const loadingConvos = ref(true)
const loadingMessages = ref(false)
const sending = ref(false)
const startingNew = ref(false)
const newSubject = ref('')
const messagesEl = ref(null)

async function loadConversations() {
  loadingConvos.value = true
  try {
    const res = await conversationsApi.list({ customer_id: auth.user.id, per_page: 20 })
    conversations.value = res.data.data || res.data || []
    if (conversations.value.length && !activeConversation.value) {
      selectConversation(conversations.value[0])
    }
  } catch (e) {
    conversations.value = []
  } finally {
    loadingConvos.value = false
  }
}

async function selectConversation(convo) {
  activeConversation.value = convo
  startingNew.value = false
  loadingMessages.value = true
  try {
    const res = await chatMessagesApi.list({ conversation_id: convo.id, per_page: 100 })
    messages.value = res.data.data || res.data || []
    await nextTick()
    scrollToBottom()
  } catch (e) {
    messages.value = []
  } finally {
    loadingMessages.value = false
  }
}

function scrollToBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

async function startNewConversation() {
  if (!newSubject.value.trim()) {
    toast.error('Please enter a subject for your inquiry.')
    return
  }
  try {
    const res = await conversationsApi.create({ customer_id: auth.user.id, subject: newSubject.value, status: 'open' })
    const convo = res.data.data || res.data
    conversations.value.unshift(convo)
    newSubject.value = ''
    selectConversation(convo)
  } catch (e) {
    toast.error('Could not start conversation.')
  }
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
      sender_role: 'customer',
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
  <div class="bg-card border border-app rounded-2xl overflow-hidden h-[600px] grid grid-cols-1 md:grid-cols-3">
    <!-- Conversations list -->
    <div class="border-r border-app flex flex-col">
      <div class="p-4 border-b border-app flex items-center justify-between">
        <h3 class="font-semibold text-main text-sm">Support Inquiries</h3>
        <button @click="startingNew = true; activeConversation = null" class="p-1.5 rounded-lg text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors">
          <Plus class="w-4 h-4" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="loadingConvos" class="text-center py-10 text-muted text-sm">Loading...</div>
        <div v-else-if="!conversations.length && !startingNew" class="text-center py-10 px-4 text-muted text-sm">
          No support conversations yet. Start one if you need help.
        </div>
        <button
          v-for="convo in conversations" :key="convo.id"
          @click="selectConversation(convo)"
          class="w-full text-left px-4 py-3 border-b border-app hover:bg-card-alt transition-colors"
          :class="activeConversation?.id === convo.id && 'bg-card-alt'"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-medium text-main truncate">{{ convo.subject }}</p>
            <BaseBadge :status="convo.status" :text="convo.status" />
          </div>
        </button>
      </div>
    </div>

    <!-- Message thread / new conversation form -->
    <div class="md:col-span-2 flex flex-col">
      <div v-if="startingNew" class="flex-1 flex items-center justify-center p-8">
        <div class="w-full max-w-sm space-y-3">
          <p class="text-sm font-medium text-main">Start a new inquiry</p>
          <BaseInput v-model="newSubject" label="Subject" placeholder="e.g. Question about my order" @keyup.enter="startNewConversation" />
          <BaseButton class="w-full" @click="startNewConversation">Start Conversation</BaseButton>
        </div>
      </div>

      <template v-else-if="activeConversation">
        <div class="px-5 py-4 border-b border-app flex items-center justify-between">
          <p class="text-sm font-semibold text-main">{{ activeConversation.subject }}</p>
          <BaseBadge :status="activeConversation.status" :text="activeConversation.status" />
        </div>

        <div ref="messagesEl" class="flex-1 overflow-y-auto p-5 space-y-3">
          <div v-if="loadingMessages" class="text-center py-10 text-muted text-sm">Loading messages...</div>
          <div v-else-if="!messages.length" class="text-center py-10 text-muted text-sm">Send a message to get started.</div>
          <div v-for="msg in messages" :key="msg.id" class="flex" :class="msg.sender_role === 'customer' ? 'justify-end' : 'justify-start'">
            <div
              class="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm"
              :class="msg.sender_role === 'customer' ? 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B]' : 'bg-card-alt text-main'"
            >
              <p>{{ msg.body }}</p>
              <p class="text-[10px] mt-1 opacity-70">{{ new Date(msg.created_at).toLocaleTimeString() }}</p>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-app flex items-center gap-2">
          <input
            v-model="messageInput" @keyup.enter="sendMessage" placeholder="Type your message..."
            class="flex-1 bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
          />
          <button @click="sendMessage" :disabled="sending" class="p-2.5 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] disabled:opacity-50 transition-all">
            <Send class="w-4 h-4" />
          </button>
        </div>
      </template>

      <div v-else class="flex-1 flex flex-col items-center justify-center gap-2 text-muted">
        <MessageSquare class="w-10 h-10 opacity-30" />
        <p class="text-sm">Select a conversation or start a new one.</p>
      </div>
    </div>
  </div>
</template>
