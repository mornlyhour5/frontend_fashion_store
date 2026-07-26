<script setup>
import Modal from './Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: 'This action cannot be undone.' },
  confirmLabel: { type: String, default: 'Confirm' },
  loading: { type: Boolean, default: false },
  danger: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
</script>

<template>
  <Modal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="" size="sm">
    <div class="flex flex-col items-center text-center gap-3 py-2">
      <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="danger ? 'bg-[#D9534F]/15' : 'bg-[#C6A75A]/15'">
        <AlertTriangle class="w-6 h-6" :class="danger ? 'text-[#D9534F]' : 'text-[#C6A75A]'" />
      </div>
      <h3 class="text-lg font-semibold text-main">{{ title }}</h3>
      <p class="text-sm text-muted">{{ message }}</p>
      <slot />
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="$emit('cancel'); $emit('update:modelValue', false)">Cancel</BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </Modal>
</template>