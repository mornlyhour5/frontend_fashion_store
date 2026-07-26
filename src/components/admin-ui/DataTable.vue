<script setup>
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, width }]
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Search...' },
  page: { type: Number, default: 1 },
  perPage: { type: Number, default: 15 },
  total: { type: Number, default: 0 },
})
const emit = defineEmits(['update:searchQuery', 'update:page', 'search'])

function totalPages() {
  return Math.max(1, Math.ceil(props.total / props.perPage))
}
</script>

<template>
  <div class="bg-card border border-app rounded-2xl shadow-luxury overflow-hidden">
    <div class="flex items-center justify-between px-5 py-4 border-b border-app gap-4 flex-wrap">
      <div class="relative flex-1 min-w-[220px] max-w-sm">
        <Search class="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', $event.target.value)"
          @keyup.enter="$emit('search')"
          type="text"
          :placeholder="searchPlaceholder"
          class="w-full bg-card-alt border border-app rounded-xl pl-9 pr-3 py-2 text-sm text-main placeholder:text-muted/60 outline-none focus:border-[#C6A75A] transition-colors"
        />
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-app">
            <th
              v-for="col in columns"
              :key="col.key"
              class="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide whitespace-nowrap"
              :style="col.width ? { width: col.width } : {}"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="text-center py-16">
              <Loader2 class="w-6 h-6 animate-spin text-[#C6A75A] mx-auto" />
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="text-center py-16 text-muted text-sm">
              No records found.
            </td>
          </tr>
          <tr
            v-else
            v-for="(row, idx) in rows"
            :key="row.id ?? idx"
            class="border-b border-app last:border-b-0 hover:bg-card-alt/60 transition-colors"
          >
            <td v-for="col in columns" :key="col.key" class="px-5 py-3.5 text-main align-middle">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between px-5 py-3.5 border-t border-app">
      <span class="text-xs text-muted">
        Showing {{ rows.length ? (page - 1) * perPage + 1 : 0 }}–{{ Math.min(page * perPage, total) }}
        of {{ total }}
      </span>
      <div class="flex items-center gap-1">
        <button
          class="p-1.5 rounded-lg border border-app text-muted hover:text-main hover:border-[#C6A75A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="page <= 1"
          @click="$emit('update:page', page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-xs text-main px-2">{{ page }} / {{ totalPages() }}</span>
        <button
          class="p-1.5 rounded-lg border border-app text-muted hover:text-main hover:border-[#C6A75A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="page >= totalPages()"
          @click="$emit('update:page', page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
