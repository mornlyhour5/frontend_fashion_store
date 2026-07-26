<script setup>
import { onMounted, watch } from 'vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'
import { Heart } from 'lucide-vue-next'

const wishlist = useWishlistStore()
const auth = useAuthStore()

function loadIfReady() {
  if (auth.isAuthenticated && !wishlist.items.length) wishlist.init()
}

onMounted(loadIfReady)
watch(() => auth.isAuthenticated, loadIfReady)
</script>

<template>
  <div class="bg-card border border-app rounded-2xl p-6">
    <h3 class="font-semibold text-main mb-6">My Wishlist</h3>

    <div v-if="wishlist.loading" class="text-center py-16 text-muted text-sm">Loading wishlist...</div>

    <div v-else-if="!wishlist.items.length" class="text-center py-16">
      <Heart class="w-12 h-12 text-muted opacity-30 mx-auto mb-3" />
      <p class="text-sm text-muted">Your wishlist is empty.</p>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-6">
      <ProductCard v-for="item in wishlist.items" :key="item.id" :product="item.product" />
    </div>
  </div>
</template>
