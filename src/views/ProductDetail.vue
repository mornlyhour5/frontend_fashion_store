<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ProductCard from '@/components/product/ProductCard.vue'
import { productsApi, productReviewsApi } from '@/api/resources'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useToastStore } from '@/stores/toast'
import { Heart, Star, Truck, RotateCcw, ShieldCheck, Minus, Plus } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const toast = useToastStore()

const product = ref(null)
const variants = ref([])
const reviews = ref([])
const related = ref([])
const loading = ref(true)

const selectedColor = ref('')
const selectedSize = ref('')
const quantity = ref(1)
const activeImage = ref(0)
const activeTab = ref('description')

const availableColors = computed(() => [...new Set(variants.value.map((v) => v.color).filter(Boolean))])
const availableSizes = computed(() => [...new Set(variants.value.map((v) => v.size).filter(Boolean))])

const selectedVariant = computed(() =>
  variants.value.find((v) => v.color === selectedColor.value && v.size === selectedSize.value)
)

const avgRating = computed(() => {
  if (!reviews.value.length) return 0
  return reviews.value.reduce((sum, r) => sum + r.rating, 0) / reviews.value.length
})

async function loadProduct() {
  loading.value = true
  try {
    const res = await productsApi.list({ slug: route.params.slug })
    const found = (res.data.data || res.data || [])[0]
    if (!found) {
      toast.error('Product not found.')
      router.push({ name: 'shop' })
      return
    }
    product.value = found
    variants.value = found.variants || []
    if (availableColors.value.length) selectedColor.value = availableColors.value[0]
    if (availableSizes.value.length) selectedSize.value = availableSizes.value[0]

    const [reviewRes, relatedRes] = await Promise.all([
      productReviewsApi.list({ product_id: found.id, status: 'approved', per_page: 20 }),
      productsApi.list({ category_id: found.category_id, per_page: 4 }),
    ])
    reviews.value = reviewRes.data.data || reviewRes.data || []
    related.value = (relatedRes.data.data || relatedRes.data || []).filter((p) => p.id !== found.id)
  } catch (e) {
    toast.error('Could not load product details.')
  } finally {
    loading.value = false
  }
}

function handleAddToCart() {
  if (!selectedVariant.value) {
    toast.error('Please select a color and size.')
    return
  }
  if (selectedVariant.value.stock < quantity.value) {
    toast.error('Not enough stock available.')
    return
  }
  cart.addItem(selectedVariant.value, product.value, quantity.value)
}

watch(() => route.params.slug, loadProduct)
onMounted(loadProduct)
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-muted">Loading product...</div>

    <div v-else-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <!-- Gallery -->
        <div>
          <div class="aspect-[3/4] rounded-2xl bg-card-alt overflow-hidden mb-3">
            <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-muted">No image available</div>
          </div>
        </div>

        <!-- Info -->
        <div>
          <p class="text-xs uppercase tracking-wide text-muted mb-2">{{ product.brand?.name || '' }}</p>
          <h1 class="text-3xl font-serif font-semibold text-main mb-3">{{ product.name }}</h1>

          <div v-if="reviews.length" class="flex items-center gap-2 mb-4">
            <div class="flex items-center gap-0.5">
              <Star v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= Math.round(avgRating) ? 'text-[#C6A75A] fill-[#C6A75A]' : 'text-muted'" />
            </div>
            <span class="text-sm text-muted">{{ avgRating.toFixed(1) }} ({{ reviews.length }} reviews)</span>
          </div>

          <p class="text-2xl font-semibold text-main mb-6">${{ Number(product.base_price).toFixed(2) }}</p>

          <!-- Color selector -->
          <div v-if="availableColors.length" class="mb-6">
            <p class="text-xs font-semibold text-main uppercase tracking-wide mb-2">Color: {{ selectedColor }}</p>
            <div class="flex items-center gap-2">
              <button
                v-for="color in availableColors" :key="color"
                @click="selectedColor = color"
                class="px-4 py-2 rounded-xl border text-sm transition-colors"
                :class="selectedColor === color ? 'border-[#C6A75A] bg-[#C6A75A]/10 text-main font-medium' : 'border-app text-muted hover:border-main'"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <!-- Size selector -->
          <div v-if="availableSizes.length" class="mb-6">
            <p class="text-xs font-semibold text-main uppercase tracking-wide mb-2">Size: {{ selectedSize }}</p>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="size in availableSizes" :key="size"
                @click="selectedSize = size"
                class="w-12 h-12 rounded-xl border text-sm transition-colors"
                :class="selectedSize === size ? 'border-[#C6A75A] bg-[#C6A75A]/10 text-main font-medium' : 'border-app text-muted hover:border-main'"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <p v-if="selectedVariant && selectedVariant.stock <= selectedVariant.low_stock_threshold" class="text-xs text-[#D9534F] mb-4">
            Only {{ selectedVariant.stock }} left in stock!
          </p>

          <!-- Quantity + Add to cart -->
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center gap-3 border border-app rounded-xl px-1">
              <button @click="quantity = Math.max(1, quantity - 1)" class="p-2.5 text-muted hover:text-main"><Minus class="w-4 h-4" /></button>
              <span class="text-sm text-main w-6 text-center">{{ quantity }}</span>
              <button @click="quantity++" class="p-2.5 text-muted hover:text-main"><Plus class="w-4 h-4" /></button>
            </div>
            <BaseButton size="lg" class="flex-1" @click="handleAddToCart">Add to Bag</BaseButton>
            <button
              @click="wishlist.toggle(product)"
              class="w-12 h-12 rounded-xl border border-app flex items-center justify-center shrink-0 transition-colors"
              :class="wishlist.isWishlisted(product.id) ? 'text-[#D9534F] border-[#D9534F]' : 'text-muted hover:text-main'"
            >
              <Heart class="w-5 h-5" :class="wishlist.isWishlisted(product.id) && 'fill-current'" />
            </button>
          </div>

          <!-- Trust badges -->
          <div class="grid grid-cols-3 gap-3 py-6 border-t border-app mt-6">
            <div class="flex flex-col items-center text-center gap-1.5">
              <Truck class="w-5 h-5 text-[#C6A75A]" />
              <p class="text-xs text-muted">Free shipping over $150</p>
            </div>
            <div class="flex flex-col items-center text-center gap-1.5">
              <RotateCcw class="w-5 h-5 text-[#C6A75A]" />
              <p class="text-xs text-muted">30-day returns</p>
            </div>
            <div class="flex flex-col items-center text-center gap-1.5">
              <ShieldCheck class="w-5 h-5 text-[#C6A75A]" />
              <p class="text-xs text-muted">Secure checkout</p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="border-t border-app pt-6 mt-2">
            <div class="flex gap-6 mb-4">
              <button @click="activeTab = 'description'" class="text-sm pb-2 border-b-2 transition-colors" :class="activeTab === 'description' ? 'border-[#C6A75A] text-main font-medium' : 'border-transparent text-muted'">Description</button>
              <button @click="activeTab = 'reviews'" class="text-sm pb-2 border-b-2 transition-colors" :class="activeTab === 'reviews' ? 'border-[#C6A75A] text-main font-medium' : 'border-transparent text-muted'">Reviews ({{ reviews.length }})</button>
            </div>
            <div v-if="activeTab === 'description'" class="text-sm text-muted leading-relaxed">
              {{ product.description || 'No description available.' }}
            </div>
            <div v-else class="space-y-4">
              <div v-if="!reviews.length" class="text-sm text-muted">No reviews yet — be the first to share your thoughts.</div>
              <div v-for="review in reviews" :key="review.id" class="border-b border-app pb-4 last:border-b-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="flex items-center gap-0.5">
                    <Star v-for="i in 5" :key="i" class="w-3.5 h-3.5" :class="i <= review.rating ? 'text-[#C6A75A] fill-[#C6A75A]' : 'text-muted'" />
                  </div>
                  <p class="text-sm font-medium text-main">{{ review.title }}</p>
                </div>
                <p class="text-sm text-muted leading-relaxed">{{ review.body }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related products -->
      <section v-if="related.length" class="mt-20">
        <h2 class="text-2xl font-serif font-semibold text-main mb-8">You May Also Like</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </section>
    </div>
  </MainLayout>
</template>
