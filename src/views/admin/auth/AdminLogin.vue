<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useThemeStore } from '@/stores/theme'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { Sparkles, ShieldCheck, Headset, Sun, Moon, Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()
const theme = useThemeStore()

const loginAs = ref('admin') // 'admin' | 'staff'
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errors = ref({})

async function handleSubmit() {
  errors.value = {}
  if (!email.value) errors.value.email = 'Email is required'
  if (!password.value) errors.value.password = 'Password is required'
  if (Object.keys(errors.value).length) return

  loading.value = true
  try {
    await auth.login({ email: email.value, password: password.value, loginAs: loginAs.value })
    toast.success(`Welcome back! Signed in as ${loginAs.value}.`)
    router.push(route.query.redirect || { name: 'admin-dashboard' })
  } catch (err) {
    toast.error(err.response?.data?.message || err.message || 'Invalid credentials')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-app flex items-center justify-center p-4 relative overflow-hidden">
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#C6A75A]/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C6A75A]/10 rounded-full blur-3xl pointer-events-none"></div>

    <button
      @click="theme.toggleTheme()"
      class="absolute top-5 right-5 p-2.5 rounded-xl border border-app text-muted hover:text-[#C6A75A] hover:border-[#C6A75A] transition-colors z-10"
    >
      <Sun v-if="theme.mode === 'dark'" class="w-[18px] h-[18px]" />
      <Moon v-else class="w-[18px] h-[18px]" />
    </button>

    <div class="w-full max-w-md relative z-10">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center mb-4 shadow-gold">
          <Sparkles class="w-7 h-7 text-[#0B0B0B]" />
        </div>
        <h1 class="text-2xl font-serif font-semibold text-main">Maison Admin</h1>
        <p class="text-sm text-muted mt-1">Fashion Store Management Console</p>
      </div>

      <div class="bg-card border border-app rounded-2xl shadow-luxury-lg p-7">
        <div class="grid grid-cols-2 gap-2 mb-6 bg-card-alt p-1.5 rounded-xl">
          <button
            type="button" @click="loginAs = 'admin'"
            class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="loginAs === 'admin' ? 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] shadow-gold' : 'text-muted hover:text-main'"
          >
            <ShieldCheck class="w-4 h-4" /> Admin
          </button>
          <button
            type="button" @click="loginAs = 'staff'"
            class="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            :class="loginAs === 'staff' ? 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] shadow-gold' : 'text-muted hover:text-main'"
          >
            <Headset class="w-4 h-4" /> Staff
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Email</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="email" type="email" placeholder="you@fashionstore.com"
                class="w-full bg-card-alt border rounded-xl pl-10 pr-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
                :class="errors.email ? 'border-[#D9534F]' : 'border-app'"
              />
            </div>
            <span v-if="errors.email" class="text-xs text-[#D9534F] mt-1 block">{{ errors.email }}</span>
          </div>

          <div>
            <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Password</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                class="w-full bg-card-alt border rounded-xl pl-10 pr-10 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
                :class="errors.password ? 'border-[#D9534F]' : 'border-app'"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <span v-if="errors.password" class="text-xs text-[#D9534F] mt-1 block">{{ errors.password }}</span>
          </div>

          <BaseButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full mt-2">
            Sign in as {{ loginAs === 'admin' ? 'Administrator' : 'Staff' }}
          </BaseButton>
        </form>
      </div>

      <p class="text-center text-xs text-muted mt-6">© 2026 Fashion Store. All rights reserved.</p>
    </div>
  </div>
</template>
