<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useThemeStore } from '@/stores/theme'
import { useNotificationStore } from '@/stores/notifications'
import { Search, Heart, ShoppingBag, User, Sun, Moon, Menu, X, Bell } from 'lucide-vue-next'

const auth = useAuthStore()
const cart = useCartStore()
const theme = useThemeStore()
const notifications = useNotificationStore()
const router = useRouter()

onMounted(() => {
  if (auth.isAuthenticated && !auth.isDashboardUser) notifications.init()
})

const mobileMenuOpen = ref(false)
const accountMenuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')

const navLinks = [
  { to: '/shop', label: 'Shop All' },
  { to: '/category/men', label: 'Men' },
  { to: '/category/women', label: 'Women' },
  { to: '/category/kids', label: 'Kids' },
  { to: '/category/sports', label: 'Sports' },
  { to: '/category/Unisex', label: 'Unisex' },
  { to: '/category/Collections', label: 'Collections' },
  { to: '/category/Limited Edition', label: 'Limited Edition' },
  { to: '/category/Best Sellers', label: 'Best Sellers' },
]

function submitSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ name: 'shop', query: { q: searchQuery.value } })
  searchOpen.value = false
  searchQuery.value = ''
}

async function handleLogout() {
  await auth.logout()
  accountMenuOpen.value = false
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-panel/95 backdrop-blur border-b border-app">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button class="lg:hidden p-2 -ml-2 text-main" @click="mobileMenuOpen = true">
          <Menu class="w-5 h-5" />
        </button>
        <RouterLink to="/" class="font-serif font-semibold text-xl text-main tracking-wide">
          MAISON
        </RouterLink>
      </div>

      <nav class="hidden lg:flex items-center gap-8">
        <RouterLink
          v-for="link in navLinks" :key="link.to" :to="link.to"
          class="text-sm text-muted hover:text-main transition-colors"
          active-class="text-main font-medium"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-1 sm:gap-2">
        <button @click="searchOpen = !searchOpen" class="p-2.5 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors">
          <Search class="w-[18px] h-[18px]" />
        </button>

        <button
          @click="theme.toggleTheme()"
          class="p-2.5 rounded-xl text-muted hover:text-[#C6A75A] hover:bg-card-alt transition-colors hidden sm:block"
        >
          <Sun v-if="theme.mode === 'dark'" class="w-[18px] h-[18px]" />
          <Moon v-else class="w-[18px] h-[18px]" />
        </button>

        <RouterLink v-if="auth.isAuthenticated && !auth.isDashboardUser" to="/account/wishlist" class="p-2.5 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors hidden sm:block">
          <Heart class="w-[18px] h-[18px]" />
        </RouterLink>

        <RouterLink v-if="auth.isAuthenticated && !auth.isDashboardUser" to="/account/notifications" class="relative p-2.5 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors hidden sm:block">
          <Bell class="w-[18px] h-[18px]" />
          <span
            v-if="notifications.unreadCount > 0"
            class="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-[#D9534F] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {{ notifications.unreadCount > 9 ? '9+' : notifications.unreadCount }}
          </span>
        </RouterLink>

        <div class="relative">
          <button @click="accountMenuOpen = !accountMenuOpen" class="p-2.5 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors">
            <User class="w-[18px] h-[18px]" />
          </button>
          <div v-if="accountMenuOpen" class="fixed inset-0 z-10" @click="accountMenuOpen = false"></div>
          <Transition name="fade">
            <div v-if="accountMenuOpen" class="absolute right-0 mt-2 w-52 bg-card border border-app rounded-xl shadow-luxury-lg py-1.5 overflow-hidden z-20">
              <template v-if="auth.isAuthenticated">
                <div class="px-4 py-2.5 border-b border-app">
                  <p class="text-sm font-medium text-main">{{ auth.displayName }}</p>
                  <p class="text-xs text-muted">{{ auth.user?.email }}</p>
                </div>
                <RouterLink v-if="auth.isDashboardUser" to="/admin" class="block px-4 py-2.5 text-sm text-[#C6A75A] font-medium hover:bg-card-alt transition-colors" @click="accountMenuOpen = false">Go to Dashboard</RouterLink>
                <RouterLink to="/account" class="block px-4 py-2.5 text-sm text-main hover:bg-card-alt transition-colors" @click="accountMenuOpen = false">My Account</RouterLink>
                <RouterLink to="/account/orders" class="block px-4 py-2.5 text-sm text-main hover:bg-card-alt transition-colors" @click="accountMenuOpen = false">Orders</RouterLink>
                <RouterLink to="/account/wishlist" class="block px-4 py-2.5 text-sm text-main hover:bg-card-alt transition-colors sm:hidden" @click="accountMenuOpen = false">Wishlist</RouterLink>
                <button @click="handleLogout" class="w-full text-left px-4 py-2.5 text-sm text-[#D9534F] hover:bg-card-alt transition-colors">Sign out</button>
              </template>
              <template v-else>
                <RouterLink to="/login" class="block px-4 py-2.5 text-sm text-main hover:bg-card-alt transition-colors" @click="accountMenuOpen = false">Sign in</RouterLink>
                <RouterLink to="/register" class="block px-4 py-2.5 text-sm text-main hover:bg-card-alt transition-colors" @click="accountMenuOpen = false">Create account</RouterLink>
              </template>
            </div>
          </Transition>
        </div>

        <button v-if="!auth.isDashboardUser" @click="cart.openDrawer()" class="relative p-2.5 rounded-xl text-muted hover:text-main hover:bg-card-alt transition-colors">
          <ShoppingBag class="w-[18px] h-[18px]" />
          <span
            v-if="cart.itemCount > 0"
            class="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 rounded-full bg-[#C6A75A] text-[#0B0B0B] text-[10px] font-bold flex items-center justify-center"
          >
            {{ cart.itemCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Search overlay -->
    <Transition name="fade">
      <div v-if="searchOpen" class="border-t border-app px-4 sm:px-6 py-4 bg-panel">
        <div class="max-w-7xl mx-auto flex items-center gap-3">
          <Search class="w-5 h-5 text-muted shrink-0" />
          <input
            v-model="searchQuery" @keyup.enter="submitSearch" autofocus
            type="text" placeholder="Search for products..."
            class="flex-1 bg-transparent text-main placeholder:text-muted/60 outline-none text-lg"
          />
          <button @click="searchOpen = false" class="p-1 text-muted hover:text-main"><X class="w-5 h-5" /></button>
        </div>
      </div>
    </Transition>

    <!-- Mobile menu -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 lg:hidden" style="background: rgba(0,0,0,0.5)" @click.self="mobileMenuOpen = false">
        <div class="w-72 h-full bg-panel p-6 flex flex-col gap-1">
          <div class="flex items-center justify-between mb-6">
            <span class="font-serif font-semibold text-xl text-main">MAISON</span>
            <button @click="mobileMenuOpen = false" class="p-1 text-muted hover:text-main"><X class="w-5 h-5" /></button>
          </div>
          <RouterLink
            v-for="link in navLinks" :key="link.to" :to="link.to"
            class="px-3 py-3 rounded-xl text-main hover:bg-card-alt transition-colors"
            @click="mobileMenuOpen = false"
          >
            {{ link.label }}
          </RouterLink>
          <button @click="theme.toggleTheme(); mobileMenuOpen = false" class="flex items-center gap-2 px-3 py-3 rounded-xl text-main hover:bg-card-alt transition-colors mt-2 border-t border-app pt-4">
            <Sun v-if="theme.mode === 'dark'" class="w-4 h-4" />
            <Moon v-else class="w-4 h-4" />
            {{ theme.mode === 'dark' ? 'Light mode' : 'Dark mode' }}
          </button>
        </div>
      </div>
    </Transition>
  </header>
</template>
