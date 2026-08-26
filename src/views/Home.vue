<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { productsApi, categoriesApi, productResource } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { ArrowRight } from 'lucide-vue-next'

const toast = useToastStore()
const trendingProducts = ref([]);
const featured = ref([])
const categories = ref([])
const loading = ref(true)

const scrollRef = ref(null)
const isDragging = ref(false)
const isPaused = ref(false)
let startX = 0
let scrollLeft = 0

function onMouseDown(e) {
  isDragging.value = true
  isPaused.value = true
  startX = e.pageX - scrollRef.value.offsetLeft
  scrollLeft = scrollRef.value.scrollLeft
}
function onMouseMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  const x = e.pageX - scrollRef.value.offsetLeft
  const walk = (x - startX) * 1.5
  scrollRef.value.scrollLeft = scrollLeft - walk
}
function stopDrag() {
  isDragging.value = false
  setTimeout(() => { isPaused.value = false }, 1500)
}

function onTouchStart(e) {
  isPaused.value = true
  startX = e.touches[0].pageX - scrollRef.value.offsetLeft
  scrollLeft = scrollRef.value.scrollLeft
}
function onTouchMove(e) {
  const x = e.touches[0].pageX - scrollRef.value.offsetLeft
  const walk = (x - startX) * 1.5
  scrollRef.value.scrollLeft = scrollLeft - walk
}
function onTouchEnd() {
  setTimeout(() => { isPaused.value = false }, 1500)
}

function onWheel(e) {
  if (Math.abs(e.deltaX) > 0) return
  e.preventDefault()
  isPaused.value = true
  scrollRef.value.scrollLeft += e.deltaY
  clearTimeout(onWheel._t)
  onWheel._t = setTimeout(() => { isPaused.value = false }, 1500)
}

async function loadHomeData() {
  loading.value = true
  try {
    const catRes = await categoriesApi.list({ per_page: 4, parent_id: 'null' })
    categories.value = catRes.data.data || catRes.data || []
  } catch (e) {
    categories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadHomeData()
    const res = await productResource.trending(8)
    trendingProducts.value = res.data.data
  } catch (e) {
    trendingProducts.value = []
  } finally {
    loading.value = false
  }
})
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
          <RouterLink to="/shop"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] font-semibold text-sm shadow-gold hover:brightness-110 transition-all">
            Shop the Collection
            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>
        <div
          class="aspect-[4/5] rounded-2xl bg-gradient-to-br from-[#C6A75A]/20 to-[#8A6F32]/10 flex items-center justify-center">
          <span class="font-serif text-2xl text-muted italic">Hero imagery goes here
            <img
              src="../assets/Images/louis-vuitton-nano-christopher-east-west-louis-vuitton-silk-tech--M2A458_PM1_Worn view.avif"
              alt="">
          </span>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16 overflow-hidden">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-serif font-semibold text-main">Shop by Category</h2>
      </div>

      <div ref="scrollRef" class="relative w-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="stopDrag" @mouseleave="stopDrag"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd" @wheel="onWheel">
        <div class="flex w-max gap-4" :class="{ 'animate-scroll-rtl': !isPaused }"
          :style="{ 'animation-play-state': isPaused ? 'paused' : 'running' }">
          <RouterLink v-for="(cat, i) in [...categories, ...categories]" :key="cat.id + '-' + i"
            :to="{ name: 'category', params: { slug: cat.slug } }"
            class="shrink-0 flex items-center justify-center px-6 h-28 hover:opacity-80 transition-opacity select-none"
            @click="isDragging && $event.preventDefault()">
            <span class="text-main font-serif text-lg font-semibold text-center whitespace-nowrap pointer-events-none">
              {{ cat.name }}
            </span>
          </RouterLink>
        </div>
      </div>

      <div v-if="!categories.length && !loading" class="text-center py-10 text-muted text-sm">
        Categories will appear here once your catalog is connected.
      </div>
    </section>

    <!-- Featured products -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16">
      <div class="flex items-center justify-between mb-8">
        <h2 class="text-2xl font-serif font-semibold text-main">Trending Now</h2>
        <RouterLink to="/shop" class="text-sm text-[#C6A75A] hover:underline flex items-center gap-1">
          View all
          <ArrowRight class="w-3.5 h-3.5" />
        </RouterLink>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard v-for="product in trendingProducts" :key="product.id" :product="product" />
        <div v-if="!trendingProducts.length && !loading" class="col-span-full text-center py-16 text-muted text-sm">
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

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>