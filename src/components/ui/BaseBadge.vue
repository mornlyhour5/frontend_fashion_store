<script setup>
defineProps({ status: { type: String, default: 'default' }, text: { type: String, required: true } })

const map = {
  pending: 'bg-[#D0A94C]/15 text-[#D0A94C]',
  processing: 'bg-[#5B8FB9]/15 text-[#5B8FB9]',
  paid: 'bg-[#4CAF7D]/15 text-[#4CAF7D]',
  shipped: 'bg-[#5B8FB9]/15 text-[#5B8FB9]',
  delivered: 'bg-[#4CAF7D]/15 text-[#4CAF7D]',
  completed: 'bg-[#4CAF7D]/15 text-[#4CAF7D]',
  cancelled: 'bg-[#D9534F]/15 text-[#D9534F]',
  failed: 'bg-[#D9534F]/15 text-[#D9534F]',
  refunded: 'bg-[#A0A0A0]/15 text-[#A0A0A0]',
  active: 'bg-[#4CAF7D]/15 text-[#4CAF7D]',
  inactive: 'bg-[#A0A0A0]/15 text-[#A0A0A0]',
  open: 'bg-[#C6A75A]/15 text-[#C6A75A]',
  resolved: 'bg-[#4CAF7D]/15 text-[#4CAF7D]',
  default: 'bg-[#A0A0A0]/15 text-[#A0A0A0]',
}
</script>

<template>
  <span class="px-2.5 py-1 rounded-lg text-xs font-medium capitalize" :class="map[status] || map.default">
    {{ text }}
  </span>
</template>
