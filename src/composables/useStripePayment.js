import { ref, shallowRef } from 'vue'
import { loadStripe } from '@stripe/stripe-js'

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

/**
 * Wraps Stripe Elements card entry. Mount with mountCard(containerEl) once the
 * DOM node exists, then call confirmCardPayment(clientSecret) at submit time.
 */
export function useStripePayment() {
  const stripe = shallowRef(null)
  const elements = shallowRef(null)
  const cardElement = shallowRef(null)
  const ready = ref(false)
  const cardError = ref('')
  const isConfigured = !!PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('xxxx')

  async function init() {
    if (!isConfigured) return false
    stripe.value = await loadStripe(PUBLISHABLE_KEY)
    if (!stripe.value) return false
    elements.value = stripe.value.elements()
    return true
  }

  function mountCard(containerEl) {
    if (!elements.value || !containerEl) return
    cardElement.value = elements.value.create('card', {
      style: {
        base: {
          color: 'var(--text-primary, #1A1A1A)',
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          '::placeholder': { color: '#A0A0A0' },
        },
        invalid: { color: '#D9534F' },
      },
    })
    cardElement.value.mount(containerEl)
    cardElement.value.on('change', (event) => {
      cardError.value = event.error ? event.error.message : ''
      ready.value = event.complete
    })
  }

  /** clientSecret comes from the backend's /payments/create-intent response */
  async function confirmCardPayment(clientSecret, billingDetails = {}) {
    if (!stripe.value || !cardElement.value) {
      throw new Error('Payment form is not ready yet.')
    }
    const result = await stripe.value.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement.value,
        billing_details: billingDetails,
      },
    })
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.paymentIntent // { id, status: 'succeeded' | ... }
  }

  function destroy() {
    cardElement.value?.destroy()
  }

  return { isConfigured, ready, cardError, init, mountCard, confirmCardPayment, destroy }
}
