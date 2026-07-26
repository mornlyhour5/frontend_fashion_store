<script setup>
import { ref, reactive } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useToastStore } from '@/stores/toast'
import { Mail, Phone, MapPin, Send } from 'lucide-vue-next'

const toast = useToastStore()
const form = reactive({ name: '', email: '', subject: '', message: '' })
const sending = ref(false)
const errors = ref({})

function validate() {
  errors.value = {}
  if (!form.name.trim()) errors.value.name = 'Name is required'
  if (!form.email.trim()) errors.value.email = 'Email is required'
  if (!form.message.trim()) errors.value.message = 'Please enter a message'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  sending.value = true
  try {
    // Wire this to a real Laravel endpoint, e.g. POST /api/contact
    await new Promise((r) => setTimeout(r, 600))
    toast.success('Message sent! We will get back to you within 1-2 business days.')
    form.name = ''; form.email = ''; form.subject = ''; form.message = ''
  } catch (e) {
    toast.error('Could not send your message. Please try again.')
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <MainLayout>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-serif font-semibold text-main mb-3">Get in Touch</h1>
        <p class="text-muted">We'd love to hear from you. Reach out with any questions.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div class="lg:col-span-1 space-y-5">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#C6A75A]/10 flex items-center justify-center shrink-0">
              <Mail class="w-4 h-4 text-[#C6A75A]" />
            </div>
            <div>
              <p class="text-sm font-medium text-main">Email</p>
              <p class="text-sm text-muted">support@maison-store.com</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#C6A75A]/10 flex items-center justify-center shrink-0">
              <Phone class="w-4 h-4 text-[#C6A75A]" />
            </div>
            <div>
              <p class="text-sm font-medium text-main">Phone</p>
              <p class="text-sm text-muted">+1 (555) 010-2030</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#C6A75A]/10 flex items-center justify-center shrink-0">
              <MapPin class="w-4 h-4 text-[#C6A75A]" />
            </div>
            <div>
              <p class="text-sm font-medium text-main">Studio</p>
              <p class="text-sm text-muted">123 Atelier Street, Suite 4<br />New York, NY 10001</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 bg-card border border-app rounded-2xl p-6">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BaseInput v-model="form.name" label="Your Name" :error="errors.name" required />
              <BaseInput v-model="form.email" label="Email" type="email" :error="errors.email" required />
            </div>
            <BaseInput v-model="form.subject" label="Subject" placeholder="What's this about?" />
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-muted uppercase tracking-wide">Message <span class="text-[#C6A75A]">*</span></label>
              <textarea
                v-model="form.message" rows="6" placeholder="Tell us how we can help..."
                class="bg-card-alt border rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none transition-colors focus:border-[#C6A75A] resize-none"
                :class="errors.message ? 'border-[#D9534F]' : 'border-app'"
              />
              <span v-if="errors.message" class="text-xs text-[#D9534F]">{{ errors.message }}</span>
            </div>
            <BaseButton type="submit" size="lg" :loading="sending">
              <Send class="w-4 h-4" /> Send Message
            </BaseButton>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
