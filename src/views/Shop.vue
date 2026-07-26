<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { productsApi, categoriesApi, brandsApi } from '@/api/resources'
import { useToastStore } from '@/stores/toast'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const toast = useToastStore()

const products = ref([])
const categories = ref([])
const brands = ref([])
const total = ref(0)
const page = ref(1)
const perPage = ref(12)
const loading = ref(true)
const filtersOpen = ref(false)

const filters = reactive({
  category_id: '',
  brand_id: '',
  gender: '',
  min_price: '',
  max_price: '',
  sort: 'newest',
})

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

const pageTitle = computed(() => {
  if (route.name === 'category') return route.params.slug.charAt(0).toUpperCase() + route.params.slug.slice(1)
  return route.query.q ? `Results for "${route.query.q}"` : 'Shop All'
})

async function loadFilters() {
  try {
    const [catRes, brandRes] = await Promise.all([categoriesApi.list({ per_page: 50 }), brandsApi.list({ per_page: 50 })])
    categories.value = catRes.data.data || catRes.data || []
    brands.value = brandRes.data.data || brandRes.data || []
  } catch (e) {
    categories.value = []
    brands.value = []
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      per_page: perPage.value,
      search: route.query.q || '',
      category_id: filters.category_id || undefined,
      brand_id: filters.brand_id || undefined,
      gender: filters.gender || undefined,
      min_price: filters.min_price || undefined,
      max_price: filters.max_price || undefined,
      sort: filters.sort,
    }
    if (route.name === 'category') params.category_slug = route.params.slug
    const res = await productsApi.list(params)
    products.value = res.data.data || res.data || []
    total.value = res.data.total ?? products.value.length
  } catch (e) {
    toast.error('Could not load products. Check your API connection.')
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function totalPages() {
  return Math.max(1, Math.ceil(total.value / perPage.value))
}

function resetFilters() {
  filters.category_id = ''
  filters.brand_id = ''
  filters.gender = ''
  filters.min_price = ''
  filters.max_price = ''
  page.value = 1
  loadProducts()
}

watch(() => route.fullPath, () => { page.value = 1; loadProducts() })
watch(page, loadProducts)

onMounted(async () => {
  await loadFilters()
  loadProducts()
})
</script>

<template>
  <MainLayout>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div class="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-serif font-semibold text-main">{{ pageTitle }}</h1>
          <p class="text-sm text-muted mt-1">{{ total }} products</p>
        </div>
        <button @click="filtersOpen = !filtersOpen" class="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-app text-sm text-main">
          <SlidersHorizontal class="w-4 h-4" /> Filters
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Filters sidebar -->
        <aside class="hidden lg:block lg:col-span-1 space-y-6">
          <div>
            <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Category</p>
            <div class="space-y-2">
              <label v-for="cat in categories" :key="cat.id" class="flex items-center gap-2 text-sm text-muted cursor-pointer hover:text-main">
                <input type="radio" :value="cat.id" v-model="filters.category_id" @change="page = 1; loadProducts()" class="accent-[#C6A75A]" />
                {{ cat.name }}
              </label>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Brand</p>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <label v-for="brand in brands" :key="brand.id" class="flex items-center gap-2 text-sm text-muted cursor-pointer hover:text-main">
                <input type="radio" :value="brand.id" v-model="filters.brand_id" @change="page = 1; loadProducts()" class="accent-[#C6A75A]" />
                {{ brand.name }}
              </label>
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Price Range</p>
            <div class="flex items-center gap-2">
              <input v-model="filters.min_price" type="number" placeholder="Min" class="w-full bg-card-alt border border-app rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-[#C6A75A]" />
              <span class="text-muted">–</span>
              <input v-model="filters.max_price" type="number" placeholder="Max" class="w-full bg-card-alt border border-app rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-[#C6A75A]" />
            </div>
            <button @click="page = 1; loadProducts()" class="text-xs text-[#C6A75A] hover:underline mt-2">Apply</button>
          </div>
          <button @click="resetFilters" class="text-xs text-muted hover:text-main underline">Clear all filters</button>
        </aside>

        <!-- Product grid -->
        <div class="lg:col-span-3">
          <div class="flex items-center justify-end mb-6">
            <div class="w-48">
              <BaseSelect v-model="filters.sort" :options="sortOptions" @update:model-value="loadProducts" />
            </div>
          </div>

          <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div v-for="i in 6" :key="i" class="aspect-[3/4] rounded-xl bg-card-alt animate-pulse"></div>
          </div>

          <div v-else-if="!products.length" class="text-center py-24 text-muted text-sm">
            No products found. Try adjusting your filters, or connect your Laravel API to populate this catalog.
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ProductCard v-for="product in products" :key="product.id" :product="product" />
          </div>

          <div v-if="products.length" class="flex items-center justify-center gap-2 mt-10">
            <button
              class="p-2 rounded-lg border border-app text-muted hover:text-main disabled:opacity-40 transition-colors"
              :disabled="page <= 1" @click="page--"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm text-main px-3">Page {{ page }} of {{ totalPages() }}</span>
            <button
              class="p-2 rounded-lg border border-app text-muted hover:text-main disabled:opacity-40 transition-colors"
              :disabled="page >= totalPages()" @click="page++"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile filters drawer -->
    <Transition name="fade">
      <div v-if="filtersOpen" class="fixed inset-0 z-50 lg:hidden" style="background: rgba(0,0,0,0.5)" @click.self="filtersOpen = false">
        <div class="absolute right-0 top-0 h-full w-80 bg-card p-6 overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <p class="font-semibold text-main">Filters</p>
            <button @click="filtersOpen = false" class="text-muted"><X class="w-5 h-5" /></button>
          </div>
          <div class="space-y-6">
            <div>
              <p class="text-xs font-semibold text-main uppercase tracking-wide mb-3">Category</p>
              <div class="space-y-2">
                <label v-for="cat in categories" :key="cat.id" class="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="radio" :value="cat.id" v-model="filters.category_id" class="accent-[#C6A75A]" />
                  {{ cat.name }}
                </label>
              </div>
            </div>
            <button @click="loadProducts(); filtersOpen = false" class="w-full py-3 rounded-xl bg-gradient-to-b from-[#D0B45C] to-[#A88A42] text-[#0B0B0B] font-semibold text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </MainLayout>
</template>
