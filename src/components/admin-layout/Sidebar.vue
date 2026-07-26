<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, ShoppingBag, Layers, Tag, Star, ClipboardList,
  Users, TicketPercent, Heart, MessageSquare, Bell, ShieldCheck, Settings, Sparkles,
  MapPin, ShoppingCart, BarChart3, History
} from 'lucide-vue-next'

defineProps({ collapsed: { type: Boolean, default: false } })
const route = useRoute()
const auth = useAuthStore()

const nav = [
  { section: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: ShoppingBag },
      { to: '/admin/products/variants', label: 'Variants', icon: Layers },
      { to: '/admin/categories', label: 'Categories', icon: Tag },
      { to: '/admin/brands', label: 'Brands', icon: Sparkles },
      { to: '/admin/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    section: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/addresses', label: 'Addresses', icon: MapPin },
      { to: '/admin/reports', label: 'Sales Reports', icon: BarChart3 },
    ],
  },
  {
    section: 'Marketing',
    items: [
      { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
      { to: '/admin/coupons/usages', label: 'Coupon Usage', icon: History },
      { to: '/admin/wishlists', label: 'Wishlists', icon: Heart },
      { to: '/admin/carts', label: 'Active Carts', icon: ShoppingCart },
    ],
  },
  {
    section: 'Support',
    items: [
      { to: '/admin/chat', label: 'Live Chat', icon: MessageSquare },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
]

const adminNav = [
  { to: '/admin/staff', label: 'Staff Management', icon: ShieldCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function isActive(to) {
  if (to === '/admin') return route.path === '/admin'
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <aside class="bg-panel border-r border-app h-screen sticky top-0 flex flex-col transition-all duration-200"
    :class="collapsed ? 'w-[76px]' : 'w-64'">
    <div class="flex items-center gap-3 px-5 h-16 border-b border-app shrink-0">
      <div
        class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center shrink-0">
        <Sparkles class="w-4 h-4 text-[#0B0B0B]" />
      </div>
      <span v-if="!collapsed"
        class="font-serif font-semibold text-main text-lg tracking-wide whitespace-nowrap overflow-hidden">
        Maison Admin
      </span>
    </div>

    <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-6">
      <div v-for="group in nav" :key="group.section">
        <p v-if="!collapsed" class="px-3 text-[10px] font-semibold text-muted/70 uppercase tracking-widest mb-2">
          {{ group.section }}
        </p>
        <div class="space-y-1">
          <RouterLink v-for="item in group.items" :key="item.to" :to="item.to" active-class="" exact-active-class=""
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors group relative" :class="isActive(item.to)
              ? 'bg-gradient-to-r from-[#C6A75A]/20 to-transparent text-[#C6A75A] font-medium'
              : 'text-muted hover:text-main hover:bg-card-alt'">
            <span v-if="isActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C6A75A] rounded-r-full" />
            <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
            <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>

      <div v-if="auth.isAdmin">
        <p v-if="!collapsed" class="px-3 text-[10px] font-semibold text-muted/70 uppercase tracking-widest mb-2">
          Administration
        </p>
        <div class="space-y-1">
          <RouterLink v-for="item in adminNav" :key="item.to" :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative" :class="isActive(item.to)
              ? 'bg-gradient-to-r from-[#C6A75A]/20 to-transparent text-[#C6A75A] font-medium'
              : 'text-muted hover:text-main hover:bg-card-alt'">
            <span v-if="isActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#C6A75A] rounded-r-full" />
            <component :is="item.icon" class="w-[18px] h-[18px] shrink-0" />
            <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <div class="p-3 border-t border-app">
      <div class="flex items-center gap-3 px-2 py-2 rounded-xl" :class="!collapsed && 'bg-card-alt'">
        <div
          class="w-9 h-9 rounded-full bg-gradient-to-br from-[#D0B45C] to-[#8A6F32] flex items-center justify-center text-[#0B0B0B] font-semibold text-sm shrink-0">
          {{ auth.displayName.charAt(0).toUpperCase() }}
        </div>
        <div v-if="!collapsed" class="overflow-hidden">
          <p class="text-sm text-main font-medium truncate">{{ auth.displayName }}</p>
          <p class="text-xs text-muted capitalize">{{ auth.role }}</p>
        </div>
      </div>
    </div>
  </aside>
</template>
