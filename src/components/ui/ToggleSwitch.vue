<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex items-center justify-between gap-4 py-4">
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-main">{{ label }}</p>
      <p v-if="description" class="text-xs text-muted mt-0.5">{{ description }}</p>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      @click="$emit('update:modelValue', !modelValue)"
      class="relative shrink-0 inline-flex items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#C6A75A]/50"
      style="width: 44px; height: 24px;"
      :class="modelValue ? 'bg-[#C6A75A]' : 'bg-card-alt border border-app'"
    >
      <span
        class="absolute rounded-full bg-white shadow-sm transition-transform duration-200"
        style="width: 18px; height: 18px; left: 3px; top: 3px;"
        :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
  </div>
</template>