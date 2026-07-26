<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
    :class="[
      size === 'sm' ? 'px-3 py-1.5 text-xs' : size === 'lg' ? 'px-6 py-3.5 text-base' : 'px-4 py-2.5 text-sm',
      variant === 'primary' && 'bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] font-semibold hover:brightness-110 shadow-gold',
      variant === 'secondary' && 'bg-card-alt text-main border border-app hover:border-[#C6A75A]',
      variant === 'ghost' && 'text-muted hover:text-main hover:bg-card-alt',
      variant === 'outline' && 'bg-transparent text-main border border-main hover:bg-main hover:text-app',
      variant === 'danger' && 'bg-[#D9534F]/10 text-[#D9534F] border border-[#D9534F]/30 hover:bg-[#D9534F]/20',
    ]"
  >
    <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
    <slot />
  </button>
</template>
