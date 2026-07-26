<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

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
    await auth.login({ email: email.value, password: password.value })
    toast.success('Welcome back!')
    router.push(route.query.redirect || { name: 'account-overview' })
  } catch (err) {
    const apiErrors = err.response?.data?.errors
    const specificMessage = apiErrors?.email?.[0]
    toast.error(specificMessage || err.response?.data?.message || 'Invalid email or password.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MainLayout>
    <div class="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-serif font-semibold text-main">Welcome Back</h1>
          <p class="text-sm text-muted mt-1">Sign in to your Maison account.</p>
        </div>

        <div class="bg-card border border-app rounded-2xl shadow-luxury p-7">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Email</label>
              <div class="relative">
                <Mail class="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input v-model="email" type="email" placeholder="you@example.com"
                  class="w-full bg-card-alt border rounded-xl pl-10 pr-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
                  :class="errors.email ? 'border-[#D9534F]' : 'border-app'" />
              </div>
              <span v-if="errors.email" class="text-xs text-[#D9534F] mt-1 block">{{ errors.email }}</span>
            </div>

            <div>
              <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Password</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                  class="w-full bg-card-alt border rounded-xl pl-10 pr-10 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
                  :class="errors.password ? 'border-[#D9534F]' : 'border-app'" />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-main">
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <span v-if="errors.password" class="text-xs text-[#D9534F] mt-1 block">{{ errors.password }}</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center gap-2 text-muted cursor-pointer">
                <input type="checkbox" class="accent-[#C6A75A] rounded" /> Remember me
              </label>
              <a href="#" class="text-[#C6A75A] hover:underline">Forgot password?</a>
            </div>

            <BaseButton type="submit" size="lg" :loading="loading" class="w-full mt-2">Sign In</BaseButton>
          </form>
        </div>

        <p class="text-center text-sm text-muted mt-6">
          Don't have an account?
          <RouterLink to="/register" class="text-[#C6A75A] hover:underline font-medium">Create one</RouterLink>
        </p>
      </div>
    </div>
  </MainLayout>
</template>
