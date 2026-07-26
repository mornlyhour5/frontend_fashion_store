<script setup>
import { useToastStore } from '@/stores/toast'
import { CheckCircle2, XCircle, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()
const iconFor = (type) => ({ success: CheckCircle2, error: XCircle, info: Info }[type] || Info)
const colorFor = (type) => ({
  success: 'border-l-4 border-l-[#4CAF7D]',
  error: 'border-l-4 border-l-[#D9534F]',
  info: 'border-l-4 border-l-[#C6A75A]',
}[type] || '')
</script>

<template>
  <div class="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-80">
    <TransitionGroup name="fade">
      <div
        v-for="t in toastStore.toasts" :key="t.id"
        class="bg-card border border-app rounded-xl shadow-luxury p-4 flex items-start gap-3"
        :class="colorFor(t.type)"
      >
        <component :is="iconFor(t.type)" class="w-5 h-5 mt-0.5 shrink-0" :class="{
          'text-[#4CAF7D]': t.type === 'success', 'text-[#D9534F]': t.type === 'error', 'text-[#C6A75A]': t.type === 'info',
        }" />
        <p class="text-sm text-main flex-1 leading-snug">{{ t.message }}</p>
        <button @click="toastStore.remove(t.id)" class="text-muted hover:text-main transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
