<script setup>
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { Sun, Moon, Monitor, Settings as SettingsIcon } from 'lucide-vue-next'

const theme = useThemeStore()
const auth = useAuthStore()
const toast = useToastStore()

const profileName = ref(auth.user?.name || '')
const profileEmail = ref(auth.user?.email || '')

function saveProfile() {
  // Wire this up to a PUT /api/auth/profile endpoint in your Laravel backend.
  toast.success('Profile changes saved.')
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-serif font-semibold text-main flex items-center gap-2">
        <SettingsIcon class="w-6 h-6 text-[#C6A75A]" /> Settings
      </h1>
      <p class="text-sm text-muted mt-1">Manage your dashboard preferences.</p>
    </div>

    <!-- Appearance -->
    <div class="bg-card border border-app rounded-2xl p-6 shadow-luxury space-y-4">
      <h3 class="text-sm font-semibold text-main">Appearance</h3>
      <p class="text-xs text-muted -mt-2">Choose how Maison Admin looks on your device.</p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          @click="theme.setTheme('dark')"
          class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors"
          :class="theme.mode === 'dark' ? 'border-[#C6A75A] bg-[#C6A75A]/10' : 'border-app hover:border-[#C6A75A]/40'"
        >
          <Moon class="w-5 h-5" :class="theme.mode === 'dark' ? 'text-[#C6A75A]' : 'text-muted'" />
          <span class="text-sm" :class="theme.mode === 'dark' ? 'text-main font-medium' : 'text-muted'">Dark</span>
        </button>
        <button
          @click="theme.setTheme('light')"
          class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors"
          :class="theme.mode === 'light' ? 'border-[#C6A75A] bg-[#C6A75A]/10' : 'border-app hover:border-[#C6A75A]/40'"
        >
          <Sun class="w-5 h-5" :class="theme.mode === 'light' ? 'text-[#C6A75A]' : 'text-muted'" />
          <span class="text-sm" :class="theme.mode === 'light' ? 'text-main font-medium' : 'text-muted'">Light</span>
        </button>
      </div>
    </div>

    <!-- Profile -->
    <div class="bg-card border border-app rounded-2xl p-6 shadow-luxury space-y-4">
      <h3 class="text-sm font-semibold text-main">Profile</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="profileName" label="Full Name" />
        <BaseInput v-model="profileEmail" label="Email" type="email" />
      </div>
      <BaseButton @click="saveProfile">Save Changes</BaseButton>
    </div>

    <!-- Security -->
    <div class="bg-card border border-app rounded-2xl p-6 shadow-luxury space-y-4">
      <h3 class="text-sm font-semibold text-main">Security</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput label="New Password" type="password" placeholder="••••••••" />
        <BaseInput label="Confirm Password" type="password" placeholder="••••••••" />
      </div>
      <BaseButton variant="secondary">Update Password</BaseButton>
    </div>
  </div>
</template>
