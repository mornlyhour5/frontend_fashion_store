<script setup>
import { ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'

defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  change: { type: Number, default: null }, // e.g. 12.5 or -4.2
  icon: { type: Object, default: null },
})
</script>

<template>
  <div class="bg-card border border-app rounded-2xl p-5 shadow-luxury hover:border-[#C6A75A]/40 transition-colors">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide font-medium">{{ label }}</p>
        <p class="text-2xl font-semibold text-main mt-2 font-serif">{{ value }}</p>
      </div>
      <div v-if="icon" class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D0B45C]/20 to-[#A88A42]/10 flex items-center justify-center">
        <component :is="icon" class="w-5 h-5 text-[#C6A75A]" />
      </div>
    </div>
    <div v-if="change !== null" class="flex items-center gap-1 mt-3 text-xs">
      <component :is="change >= 0 ? ArrowUpRight : ArrowDownRight" class="w-3.5 h-3.5" :class="change >= 0 ? 'text-[#4CAF7D]' : 'text-[#D9534F]'" />
      <span :class="change >= 0 ? 'text-[#4CAF7D]' : 'text-[#D9534F]'" class="font-medium">{{ Math.abs(change) }}%</span>
      <span class="text-muted">vs last period</span>
    </div>
  </div>
</template>
