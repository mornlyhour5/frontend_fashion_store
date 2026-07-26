<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { addressesApi, checkoutApi, productVariantsLookup } from '@/api/resources'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useStripePayment } from '@/composables/useStripePayment'
import { MapPin, CreditCard, Tag, Check, Lock, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()
const stripePayment = useStripePayment()

// ---- Steps: address -> payment -> review ----
const step = ref('address') // 'address' | 'payment' | 'review'

const addresses = ref([])
const selectedAddressId = ref(null)
const showNewAddressForm = ref(false)
const newAddress = reactive({
  label: '', recipient_name: '', phone: '', address: '', city: '', province: '', postal_code: '', country: '',
})

const paymentMethod = ref('cod')
const paymentOptions = [
  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
  { value: 'card', label: 'Credit / Debit Card', desc: 'Secure payment via Stripe' },
  { value: 'bank_transfer', label: 'Bank Transfer', desc: 'We confirm once funds are received' },
]

const cardMountEl = ref(null)
const cardMounted = ref(false)

const couponCode = ref('')
const appliedCoupon = ref(null)
const applyingCoupon = ref(false)

const placingOrder = ref(false)
const orderError = ref('')
const loading = ref(true)

const shippingFee = computed(() => (cart.subtotal >= 150 ? 0 : 9.99))
const discount = computed(() => {
  if (!appliedCoupon.value) return 0
  if (appliedCoupon.value.type === 'percentage') {
    const amt = (cart.subtotal * appliedCoupon.value.value) / 100
    return appliedCoupon.value.maximum_discount ? Math.min(amt, appliedCoupon.value.maximum_discount) : amt
  }
  return Number(appliedCoupon.value.value)
})
const total = computed(() => Math.max(0, cart.subtotal + shippingFee.value - discount.value))
const selectedAddress = computed(() => addresses.value.find((a) => a.id === selectedAddressId.value))

async function loadAddresses() {
  loading.value = true
  try {
    const res = await addressesApi.list({ user_id: auth.user.id })
    addresses.value = res.data.data || res.data || []
    const def = addresses.value.find((a) => a.is_default) || addresses.value[0]
    if (def) selectedAddressId.value = def.id
    else showNewAddressForm.value = true
  } catch (e) {
    addresses.value = []
    showNewAddressForm.value = true
  } finally {
    loading.value = false
  }
}

async function saveNewAddress() {
  try {
    const res = await addressesApi.create({ ...newAddress, user_id: auth.user.id, is_default: addresses.value.length === 0 })
    const created = res.data.data || res.data
    addresses.value.push(created)
    selectedAddressId.value = created.id
    showNewAddressForm.value = false
    toast.success('Address saved.')
  } catch (e) {
    toast.error('Could not save address.')
  }
}

function goToPayment() {
  if (!selectedAddressId.value) {
    toast.error('Please select or add a shipping address.')
    return
  }
  step.value = 'payment'
}

async function goToReview() {
  if (paymentMethod.value === 'card' && !stripePayment.isConfigured) {
    toast.error('Card payments are not configured yet. Please choose another payment method.')
    return
  }
  if (paymentMethod.value === 'card' && !stripePayment.ready.value) {
    toast.error('Please complete your card details.')
    return
  }
  step.value = 'review'
}

watch(step, async (val) => {
  if (val === 'payment' && paymentMethod.value === 'card') {
    await mountStripeCard()
  }
})

watch(paymentMethod, async (val) => {
  if (val === 'card' && step.value === 'payment') {
    await mountStripeCard()
  }
})

async function mountStripeCard() {
  if (cardMounted.value || !stripePayment.isConfigured) return
  const success = await stripePayment.init()
  if (!success) return
  await nextTick()
  if (cardMountEl.value) {
    stripePayment.mountCard(cardMountEl.value)
    cardMounted.value = true
  }
}

async function applyCoupon() {
  if (!couponCode.value.trim()) return
  applyingCoupon.value = true
  try {
    const res = await checkoutApi.applyCoupon(couponCode.value.trim(), cart.subtotal)
    appliedCoupon.value = res.data.coupon || res.data
    toast.success('Coupon applied!')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Invalid or expired coupon code.')
  } finally {
    applyingCoupon.value = false
  }
}

/**
 * Re-checks stock on every cart line right before charging anything.
 * Prevents selling out-of-stock items that went stale while the user
 * was browsing/typing their address.
 */
async function revalidateStock() {
  for (const item of cart.items) {
    try {
      const res = await productVariantsLookup.list(item.product?.id)
      const variants = res.data.data || res.data || []
      const current = variants.find((v) => v.id === item.product_variant_id)
      if (current && current.stock < item.quantity) {
        return { ok: false, item, available: current.stock }
      }
    } catch (e) {
      // If the lookup endpoint isn't wired up yet, don't block checkout —
      // let the backend do the authoritative check on order creation instead.
      continue
    }
  }
  return { ok: true }
}

async function placeOrder() {
  orderError.value = ''
  placingOrder.value = true

  try {
    const stockCheck = await revalidateStock()
    if (!stockCheck.ok) {
      orderError.value = `Only ${stockCheck.available} left of "${stockCheck.item.product?.name}". Please update your bag.`
      placingOrder.value = false
      step.value = 'review'
      return
    }

    const basePayload = {
      address_id: selectedAddressId.value,
      payment_method: paymentMethod.value,
      coupon_code: appliedCoupon.value?.code || null,
      items: cart.items.map((i) => ({
        product_variant_id: i.product_variant_id,
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: cart.subtotal,
      shipping_fee: shippingFee.value,
      total_amount: total.value,
    }

    if (paymentMethod.value === 'card') {
      // 1. Create the order server-side first (payment_status: pending)
      const orderRes = await checkoutApi.placeOrder({ ...basePayload, payment_status: 'pending' })
      const order = orderRes.data.data || orderRes.data

      // 2. Create a Stripe PaymentIntent for that order's amount
      const intentRes = await checkoutApi.createPaymentIntent({
        order_id: order.id,
        amount: Math.round(total.value * 100), // cents
        currency: 'usd',
      })
      const { client_secret, payment_id } = intentRes.data

      // 3. Confirm the card payment client-side (3D Secure handled by Stripe)
      const intent = await stripePayment.confirmCardPayment(client_secret, {
        name: selectedAddress.value?.recipient_name,
        email: auth.user?.email,
        phone: selectedAddress.value?.phone,
      })

      // 4. Tell the backend the payment succeeded so it can flip payment_status -> 'paid'
      await checkoutApi.confirmPayment(payment_id, {
        order_id: order.id,
        stripe_payment_intent_id: intent.id,
        status: intent.status,
      })

      await cart.clearCart()
      toast.success('Payment successful! Order placed.')
      router.push({ name: 'order-confirmation', params: { id: order.id } })
    } else {
      // COD and bank transfer: no client-side charge, order goes in as pending/awaiting payment
      const res = await checkoutApi.placeOrder({
        ...basePayload,
        payment_status: paymentMethod.value === 'cod' ? 'pending' : 'awaiting_transfer',
      })
      const order = res.data.data || res.data
      await cart.clearCart()
      toast.success('Order placed successfully!')
      router.push({ name: 'order-confirmation', params: { id: order.id } })
    }
  } catch (e) {
    orderError.value = e.response?.data?.message || e.message || 'Could not place order. Please try again.'
    toast.error(orderError.value)
  } finally {
    placingOrder.value = false
  }
}

onMounted(loadAddresses)
</script>

<template>
  <MainLayout>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 class="text-2xl font-serif font-semibold text-main mb-2">Checkout</h1>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 mb-8 text-xs">
        <span class="px-3 py-1.5 rounded-full font-medium" :class="step === 'address' ? 'bg-[#C6A75A] text-[#0B0B0B]' : 'bg-card-alt text-muted'">1. Address</span>
        <span class="text-muted">—</span>
        <span class="px-3 py-1.5 rounded-full font-medium" :class="step === 'payment' ? 'bg-[#C6A75A] text-[#0B0B0B]' : 'bg-card-alt text-muted'">2. Payment</span>
        <span class="text-muted">—</span>
        <span class="px-3 py-1.5 rounded-full font-medium" :class="step === 'review' ? 'bg-[#C6A75A] text-[#0B0B0B]' : 'bg-card-alt text-muted'">3. Review & Pay</span>
      </div>

      <div v-if="!cart.items.length" class="text-center py-24 text-muted">
        Your bag is empty. <RouterLink to="/shop" class="text-[#C6A75A] hover:underline">Go shopping</RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- STEP 1: Address -->
          <div v-if="step === 'address'" class="bg-card border border-app rounded-2xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <MapPin class="w-4 h-4 text-[#C6A75A]" />
              <h3 class="font-semibold text-main">Shipping Address</h3>
            </div>

            <div v-if="loading" class="text-sm text-muted">Loading addresses...</div>

            <div v-else class="space-y-3">
              <label
                v-for="addr in addresses" :key="addr.id"
                class="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors"
                :class="selectedAddressId === addr.id ? 'border-[#C6A75A] bg-[#C6A75A]/5' : 'border-app hover:border-main'"
              >
                <input type="radio" :value="addr.id" v-model="selectedAddressId" class="mt-1 accent-[#C6A75A]" />
                <div class="text-sm">
                  <p class="font-medium text-main">{{ addr.label || 'Address' }} — {{ addr.recipient_name }}</p>
                  <p class="text-muted mt-0.5">{{ addr.address }}, {{ addr.city }}, {{ addr.province }} {{ addr.postal_code }}</p>
                  <p class="text-muted">{{ addr.phone }}</p>
                </div>
              </label>

              <button v-if="!showNewAddressForm" @click="showNewAddressForm = true" class="text-sm text-[#C6A75A] hover:underline">
                + Add a new address
              </button>

              <div v-if="showNewAddressForm" class="border border-app rounded-xl p-4 space-y-3 mt-2">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <BaseInput v-model="newAddress.label" label="Label" placeholder="Home, Office..." />
                  <BaseInput v-model="newAddress.recipient_name" label="Recipient Name" required />
                  <BaseInput v-model="newAddress.phone" label="Phone" />
                  <BaseInput v-model="newAddress.country" label="Country" />
                  <div class="sm:col-span-2">
                    <BaseInput v-model="newAddress.address" label="Street Address" required />
                  </div>
                  <BaseInput v-model="newAddress.city" label="City" />
                  <BaseInput v-model="newAddress.province" label="Province/State" />
                  <BaseInput v-model="newAddress.postal_code" label="Postal Code" />
                </div>
                <div class="flex gap-2">
                  <BaseButton size="sm" @click="saveNewAddress">Save Address</BaseButton>
                  <BaseButton size="sm" variant="ghost" @click="showNewAddressForm = false">Cancel</BaseButton>
                </div>
              </div>
            </div>

            <BaseButton class="mt-6 w-full sm:w-auto" @click="goToPayment">Continue to Payment</BaseButton>
          </div>

          <!-- STEP 2: Payment -->
          <div v-if="step === 'payment'" class="bg-card border border-app rounded-2xl p-6">
            <div class="flex items-center gap-2 mb-4">
              <CreditCard class="w-4 h-4 text-[#C6A75A]" />
              <h3 class="font-semibold text-main">Payment Method</h3>
            </div>
            <div class="space-y-2">
              <label
                v-for="opt in paymentOptions" :key="opt.value"
                class="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors"
                :class="paymentMethod === opt.value ? 'border-[#C6A75A] bg-[#C6A75A]/5' : 'border-app hover:border-main'"
              >
                <input type="radio" :value="opt.value" v-model="paymentMethod" class="accent-[#C6A75A]" />
                <div>
                  <span class="text-sm text-main block">{{ opt.label }}</span>
                  <span class="text-xs text-muted">{{ opt.desc }}</span>
                </div>
              </label>
            </div>

            <!-- Card entry -->
            <div v-if="paymentMethod === 'card'" class="mt-4">
              <div v-if="!stripePayment.isConfigured" class="flex items-start gap-2 p-3.5 rounded-xl bg-[#D0A94C]/10 border border-[#D0A94C]/30 text-sm text-[#D0A94C]">
                <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
                <span>Card payments aren't configured yet. Set <code class="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> in your <code class="text-xs">.env</code> to enable this.</span>
              </div>
              <template v-else>
                <label class="text-xs font-medium text-muted uppercase tracking-wide mb-1.5 block">Card Details</label>
                <div ref="cardMountEl" class="bg-card-alt border border-app rounded-xl px-4 py-3.5"></div>
                <p v-if="stripePayment.cardError.value" class="text-xs text-[#D9534F] mt-1.5">{{ stripePayment.cardError.value }}</p>
                <p class="flex items-center gap-1.5 text-xs text-muted mt-2">
                  <Lock class="w-3 h-3" /> Payments are encrypted and processed securely by Stripe.
                </p>
              </template>
            </div>

            <div class="flex gap-2 mt-6">
              <BaseButton variant="ghost" @click="step = 'address'">Back</BaseButton>
              <BaseButton @click="goToReview">Continue to Review</BaseButton>
            </div>
          </div>

          <!-- STEP 3: Review -->
          <div v-if="step === 'review'" class="bg-card border border-app rounded-2xl p-6 space-y-5">
            <h3 class="font-semibold text-main">Review Your Order</h3>

            <div class="border border-app rounded-xl p-4">
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Shipping To</p>
              <p class="text-sm text-main">{{ selectedAddress?.recipient_name }}</p>
              <p class="text-sm text-muted">{{ selectedAddress?.address }}, {{ selectedAddress?.city }}, {{ selectedAddress?.province }} {{ selectedAddress?.postal_code }}</p>
              <button @click="step = 'address'" class="text-xs text-[#C6A75A] hover:underline mt-2">Change</button>
            </div>

            <div class="border border-app rounded-xl p-4">
              <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Payment Method</p>
              <p class="text-sm text-main capitalize">{{ paymentOptions.find(o => o.value === paymentMethod)?.label }}</p>
              <button @click="step = 'payment'" class="text-xs text-[#C6A75A] hover:underline mt-2">Change</button>
            </div>

            <div v-if="orderError" class="flex items-start gap-2 p-3.5 rounded-xl bg-[#D9534F]/10 border border-[#D9534F]/30 text-sm text-[#D9534F]">
              <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
              <span>{{ orderError }}</span>
            </div>

            <div class="flex gap-2">
              <BaseButton variant="ghost" @click="step = 'payment'">Back</BaseButton>
              <BaseButton class="flex-1" :loading="placingOrder" @click="placeOrder">
                {{ paymentMethod === 'card' ? `Pay $${total.toFixed(2)} Now` : 'Place Order' }}
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Order summary (always visible) -->
        <div class="lg:col-span-1">
          <div class="bg-card border border-app rounded-2xl p-6 sticky top-24 space-y-4">
            <h3 class="font-serif font-semibold text-lg text-main">Order Summary</h3>

            <div class="space-y-2 max-h-56 overflow-y-auto">
              <div v-for="item in cart.items" :key="item.id" class="flex justify-between text-sm">
                <span class="text-muted">{{ item.product?.name }} × {{ item.quantity }}</span>
                <span class="text-main">${{ (Number(item.price) * item.quantity).toFixed(2) }}</span>
              </div>
            </div>

            <div class="border-t border-app pt-3 flex items-center gap-2">
              <Tag class="w-4 h-4 text-muted shrink-0" />
              <input
                v-model="couponCode" placeholder="Coupon code"
                class="flex-1 bg-card-alt border border-app rounded-lg px-3 py-2 text-sm text-main outline-none focus:border-[#C6A75A]"
              />
              <BaseButton size="sm" variant="secondary" :loading="applyingCoupon" @click="applyCoupon">Apply</BaseButton>
            </div>
            <p v-if="appliedCoupon" class="text-xs text-[#4CAF7D] flex items-center gap-1">
              <Check class="w-3.5 h-3.5" /> {{ appliedCoupon.code }} applied
            </p>

            <div class="border-t border-app pt-4 space-y-1.5 text-sm">
              <div class="flex justify-between text-muted"><span>Subtotal</span><span>${{ cart.subtotal.toFixed(2) }}</span></div>
              <div class="flex justify-between text-muted"><span>Shipping</span><span>{{ shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}` }}</span></div>
              <div v-if="discount > 0" class="flex justify-between text-[#4CAF7D]"><span>Discount</span><span>-${{ discount.toFixed(2) }}</span></div>
              <div class="flex justify-between font-semibold text-main text-base pt-2 border-t border-app mt-1">
                <span>Total</span><span>${{ total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
