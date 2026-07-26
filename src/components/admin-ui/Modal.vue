<script setup>
import { X } from 'lucide-vue-next'
import { watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md | lg | xl
})
const emit = defineEmits(['update:modelValue', 'close'])

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

watch(
  () => props.modelValue,
  (val) => {
    document.body.style.overflow = val ? 'hidden' : ''
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(3px)"
        @mousedown.self="close"
      >
        <Transition name="modal" appear>
          <div
            v-if="modelValue"
            class="bg-card border border-app rounded-2xl shadow-luxury-lg w-full flex flex-col max-h-[90vh]"
            :class="sizeClass[size]"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-app shrink-0">
              <h3 class="text-lg font-semibold text-main font-serif">{{ title }}</h3>
              <button
                @click="close"
                class="text-muted hover:text-main hover:bg-card-alt rounded-lg p-1.5 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
            <div class="px-6 py-5 overflow-y-auto">
              <slot />
            </div>
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-app flex justify-end gap-3 shrink-0">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
