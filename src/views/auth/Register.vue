<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const form = ref({ name: '', email: '', password: '', password_confirmation: '' })
const loading = ref(false)
const errors = ref({})

function validate() {
  errors.value = {}
  if (!form.value.name) errors.value.name = 'Name is required'
  if (!form.value.email) errors.value.email = 'Email is required'
  if (!form.value.password) errors.value.password = 'Password is required'
  else if (form.value.password.length < 8) errors.value.password = 'Password must be at least 8 characters'
  if (form.value.password !== form.value.password_confirmation) errors.value.password_confirmation = 'Passwords do not match'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await auth.register(form.value)
    toast.success('Account created! Welcome to Maison.')
    router.push({ name: 'account-overview' })
  } catch (err) {
    toast.error(err.response?.data?.message || 'Could not create account.')
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
          <h1 class="text-2xl font-serif font-semibold text-main">Create Your Account</h1>
          <p class="text-sm text-muted mt-1">Join Maison for a personalized shopping experience.</p>
        </div>

        <div class="bg-card border border-app rounded-2xl shadow-luxury p-7">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <BaseInput v-model="form.name" label="Full Name" :error="errors.name" required />
            <BaseInput v-model="form.email" label="Email" type="email" :error="errors.email" required />
            <BaseInput v-model="form.password" label="Password" type="password" :error="errors.password" required />
            <BaseInput v-model="form.password_confirmation" label="Confirm Password" type="password" :error="errors.password_confirmation" required />
            <BaseButton type="submit" size="lg" :loading="loading" class="w-full mt-2">Create Account</BaseButton>
          </form>
        </div>

        <p class="text-center text-sm text-muted mt-6">
          Already have an account?
          <RouterLink to="/login" class="text-[#C6A75A] hover:underline font-medium">Sign in</RouterLink>
        </p>
      </div>
    </div>
  </MainLayout>
</template>
