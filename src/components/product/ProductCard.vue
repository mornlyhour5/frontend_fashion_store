<script setup>
import { RouterLink } from 'vue-router'
import { useWishlistStore } from '@/stores/wishlist'
import { Heart } from 'lucide-vue-next'

const props = defineProps({ product: { type: Object, required: true } })
const wishlist = useWishlistStore()

function toggleWishlist() {
  wishlist.toggle(props.product)
}
</script>

<template>
  <RouterLink :to="{ name: 'product-detail', params: { slug: product.slug } }" class="group block">
    <div class="relative aspect-[3/4] rounded-xl overflow-hidden bg-card-alt mb-3">
      <img
        v-if="product.image_url"
        :src="product.image_url" :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-muted text-sm">No image</div>

      <button
        @click.prevent="toggleWishlist"
        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-panel/90 backdrop-blur flex items-center justify-center transition-colors"
        :class="wishlist.isWishlisted(product.id) ? 'text-[#D9534F]' : 'text-main hover:text-[#D9534F]'"
      >
        <Heart class="w-4 h-4" :class="wishlist.isWishlisted(product.id) && 'fill-current'" />
      </button>

      <span v-if="product.badge" class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-panel/90 backdrop-blur text-[10px] font-semibold uppercase tracking-wide text-main">
        {{ product.badge }}
      </span>
    </div>
    <p class="text-xs text-muted uppercase tracking-wide mb-1">{{ product.brand?.name || '' }}</p>
    <p class="text-sm font-medium text-main line-clamp-2">{{ product.name }}</p>
    <p class="text-sm text-main mt-1 font-semibold">${{ Number(product.base_price).toFixed(2) }}</p>
  </RouterLink>
</template>
