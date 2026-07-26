<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  required: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-medium text-muted uppercase tracking-wide">
      {{ label }} <span v-if="required" class="text-[#C6A75A]">*</span>
    </label>
    <select
      :value="modelValue" @change="$emit('update:modelValue', $event.target.value)"
      class="bg-card-alt border border-app rounded-xl px-4 py-2.5 text-sm text-main outline-none focus:border-[#C6A75A] transition-colors"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>
