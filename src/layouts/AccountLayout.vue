<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import MainLayout from './MainLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { User, Package, Heart, MapPin, HeadphonesIcon, Bell, Settings } from 'lucide-vue-next'

const route = useRoute()
const auth = useAuthStore()

const links = [
  { to: '/account', label: 'Overview', icon: User, exact: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/profile', label: 'Account Settings', icon: Settings },
  { to: '/account/support', label: 'Support', icon: HeadphonesIcon },
]

function isActive(link) {
  return link.exact ? route.path === link.to : route.path.startsWith(link.to)
}
</script>

<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div class="mb-8">
        <h1 class="text-2xl font-serif font-semibold text-main">My Account</h1>
        <p class="text-sm text-muted mt-1">Welcome back, {{ auth.firstName }}.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside class="lg:col-span-1">
          <nav class="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            <RouterLink
              v-for="link in links" :key="link.to" :to="link.to"
              class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors"
              :class="isActive(link) ? 'bg-card-alt text-main font-medium' : 'text-muted hover:text-main hover:bg-card-alt/50'"
            >
              <component :is="link.icon" class="w-4 h-4 shrink-0" />
              {{ link.label }}
            </RouterLink>
          </nav>
        </aside>

        <div class="lg:col-span-3">
          <RouterView />
        </div>
      </div>
    </div>
  </MainLayout>
</template>
