<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { productsApi, categoriesApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowRight } from 'lucide-vue-next'

const toast = useToastStore()
const featured = ref([])
const categories = ref([])
const loading = ref(true)

async function loadHomeData() {
  loading.value = true
  try {
    const [prodRes, catRes] = await Promise.all([
      productsApi.list({ per_page: 8, sort: '-views_count' }),
      categoriesApi.list({ per_page: 4, parent_id: 'null' }),
    ])
    featured.value = prodRes.data.data || prodRes.data || []
    categories.value = catRes.data.data || catRes.data || []
  } catch (e) {
    featured.value = []
    categories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadHomeData)
</script>

<template>
  <MainLayout>
    <!-- Hero -->
    <section class="relative bg-card-alt overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-[#C6A75A] font-semibold mb-4">New Collection</p>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold text-main leading-[1.1] mb-6">
            Timeless Style, <br />Modern Craft.
          </h1>
          <p class="text-muted text-base leading-relaxed mb-8 max-w-md">
            Discover pieces designed to last — thoughtfully made, quietly elegant, built for the way you actually live.
          </p>
          <RouterLink
            to="/shop"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] font-semibold text-sm shadow-gold hover:brightness-110 transition-all"
          >
            Shop the Collection <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-[#C6A75A]/20 to-[#8A6F32]/10 flex items-center justify-center">
          <span class="font-serif text-2xl text-muted italic">Hero imagery goes here
            <img src="../assets/Images/louis-vuitton-nano-christopher-east-west-louis-vuitton-silk-tech--M2A458_PM1_Worn view.avif" alt="">
          </span>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-serif font-semibold text-main">Shop by Category</h2>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <RouterLink
          v-for="cat in categories" :key="cat.id"
          :to="{ name: 'category', params: { slug: cat.slug } }"
          class="group relative aspect-square rounded-2xl overflow-hidden bg-card-alt flex items-end p-5"
        >
          <img v-if="cat.image" :src="cat.image_url" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span class="relative text-white font-serif text-lg font-semibold drop-shadow" v-if="cat.image">{{ cat.name }}</span>
          <span class="relative text-main font-serif text-lg font-semibold" v-else>{{ cat.name }}</span>
        </RouterLink>
        <div v-if="!categories.length && !loading" class="col-span-full text-center py-10 text-muted text-sm">
          Categories will appear here once your catalog is connected.
        </div>
      </div>
    </section>

    <!-- Featured products -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-serif font-semibold text-main">Trending Now</h2>
        <RouterLink to="/shop" class="text-sm text-[#C6A75A] hover:underline flex items-center gap-1">
          View all <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard v-for="product in featured" :key="product.id" :product="product" />
        <div v-if="!featured.length && !loading" class="col-span-full text-center py-16 text-muted text-sm">
          Products will appear here once your catalog is connected.
        </div>
      </div>
    </section>

    <!-- Value props -->
    <section class="bg-card-alt py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div>
          <p class="font-serif text-lg font-semibold text-main mb-2">Free Shipping</p>
          <p class="text-sm text-muted">On all orders over $150</p>
        </div>
        <div>
          <p class="font-serif text-lg font-semibold text-main mb-2">Easy Returns</p>
          <p class="text-sm text-muted">30-day hassle-free returns</p>
        </div>
        <div>
          <p class="font-serif text-lg font-semibold text-main mb-2">Secure Checkout</p>
          <p class="text-sm text-muted">Your data is always protected</p>
        </div>
      </div>
    </section>
  </MainLayout>
</template>
