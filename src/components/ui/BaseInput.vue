<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-medium text-muted uppercase tracking-wide">
      {{ label }} <span v-if="required" class="text-[#C6A75A]">*</span>
    </label>
    <input
      :type="type" :value="modelValue" :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      class="bg-card-alt border rounded-xl px-4 py-2.5 text-sm text-main placeholder:text-muted/60 outline-none transition-colors focus:border-[#C6A75A]"
      :class="error ? 'border-[#D9534F]' : 'border-app'"
    />
    <span v-if="error" class="text-xs text-[#D9534F]">{{ error }}</span>
  </div>
</template>
