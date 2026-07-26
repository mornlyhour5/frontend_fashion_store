<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown } from 'lucide-vue-next'

defineProps({ })
const emit = defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()
const menuOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  router.push({ name: 'admin-login' })
}
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

      <button class="relative p-2.5 rounded-xl border border-app text-muted hover:text-main hover:border-[#C6A75A] transition-colors">
        <Bell class="w-[18px] h-[18px]" />
        <span class="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D9534F]"></span>
      </button>

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
