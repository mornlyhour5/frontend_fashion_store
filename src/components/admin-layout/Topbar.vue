<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotificationStore } from '@/stores/notifications'
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown, CheckCheck } from 'lucide-vue-next'

defineProps({ })
const emit = defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const theme = useThemeStore()
const notifications = useNotificationStore()
const router = useRouter()
const menuOpen = ref(false)
const notifOpen = ref(false)

const DROPDOWN_LIMIT = 7

const dropdownItems = computed(() => {
  const items = Array.isArray(notifications.items) ? notifications.items : []
  return items.filter((n) => !n.read_at).slice(0, DROPDOWN_LIMIT)
})

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'admin-login' })
}

function goToNotifications() {
  notifOpen.value = false
  router.push({ name: 'admin-notifications' })
}

onMounted(() => {
  notifications.init()
})
</script>

<template>
  <header class="h-16 bg-panel border-b border-app flex items-center justify-between px-5 sticky top-0 z-30">
    <button @click="$emit('toggle-sidebar')" class="p-2 rounded-lg text-muted hover:text-main hover:bg-card-alt transition-colors">
      <Menu class="w-5 h-5" />
    </button>

    <div class="flex items-center gap-2">
      <button
        @click="theme.toggleTheme()"
        class="p-2.5 rounded-xl border border-app text-muted hover:text-[#C6A75A] hover:border-[#C6A75A] transition-colors"
        :title="theme.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="theme.mode === 'dark'" class="w-[18px] h-[18px]" />
        <Moon v-else class="w-[18px] h-[18px]" />
      </button>

      <div class="relative">
        <button
          @click="notifOpen = !notifOpen"
          class="relative p-2.5 rounded-xl border border-app text-muted hover:text-main hover:border-[#C6A75A] transition-colors"
        >
          <Bell class="w-[18px] h-[18px]" />
          <span
            v-if="notifications.unreadCount > 0"
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D9534F] text-white text-[10px] font-semibold flex items-center justify-center"
          >
            {{ notifications.unreadCount > 9 ? '9+' : notifications.unreadCount }}
          </span>
        </button>

        <div v-if="notifOpen" class="fixed inset-0 z-10" @click="notifOpen = false"></div>
        <Transition name="fade">
          <div
            v-if="notifOpen"
            class="absolute right-0 mt-2 w-80 bg-card border border-app rounded-xl shadow-luxury-lg overflow-hidden z-20"
          >
            <div class="px-4 py-3 border-b border-app flex items-center justify-between">
              <span class="text-sm font-medium text-main">Notifications</span>
              <span v-if="notifications.unreadCount > 0" class="text-xs text-muted">{{ notifications.unreadCount }} unread</span>
            </div>

            <div class="max-h-96 overflow-y-auto">
              <div v-if="!notifications.loaded" class="text-center py-8 text-muted text-xs">Loading...</div>
              <div v-else-if="!dropdownItems.length" class="text-center py-8 text-muted text-xs">No unread notifications.</div>
              <button
                v-for="n in dropdownItems"
                :key="n.id"
                @click="goToNotifications"
                class="w-full text-left px-4 py-3 border-b border-app last:border-b-0 hover:bg-card-alt/60 transition-colors flex items-start gap-2.5"
              >
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" :class="n.read_at ? 'bg-card-alt' : 'bg-[#C6A75A]/15'">
                  <Bell class="w-3.5 h-3.5" :class="n.read_at ? 'text-muted' : 'text-[#C6A75A]'" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-main truncate">{{ n.title }}</p>
                  <p class="text-xs text-muted mt-0.5 truncate">{{ n.body }}</p>
                </div>
                <CheckCheck v-if="n.read_at" class="w-3.5 h-3.5 text-[#4CAF7D] shrink-0 mt-0.5" />
                <span v-else class="w-1.5 h-1.5 rounded-full bg-[#C6A75A] shrink-0 mt-1.5"></span>
              </button>
            </div>

            <button
              @click="goToNotifications"
              class="w-full text-center px-4 py-2.5 text-xs font-medium text-[#C6A75A] hover:bg-card-alt transition-colors border-t border-app"
            >
              View all
            </button>
          </div>
        </Transition>
      </div>

      <div class="relative">
        <button @click="menuOpen = !menuOpen" class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-card-alt transition-colors">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-xs">
            {{ auth.displayName.charAt(0).toUpperCase() }}
          </div>
          <span class="text-sm text-main hidden sm:block">{{ auth.displayName }}</span>
          <ChevronDown class="w-4 h-4 text-muted" />
        </button>

        <div v-if="menuOpen" class="fixed inset-0 z-10" @click="menuOpen = false"></div>
        <Transition name="fade">
          <div
            v-if="menuOpen"
            class="absolute right-0 mt-2 w-48 bg-card border border-app rounded-xl shadow-luxury-lg py-1.5 overflow-hidden z-20"
          >
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#D9534F] hover:bg-card-alt transition-colors"
            >
              <LogOut class="w-4 h-4" />
              Sign out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>