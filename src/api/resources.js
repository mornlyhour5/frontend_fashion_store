import { createResource } from './resource'
import client from './client'

export const productsApi = createResource('products')
export const categoriesApi = createResource('categories')
export const brandsApi = createResource('brands')
// export const productReviewsApi = createResource('product-reviews')
export const cartsApi = createResource('carts')
export const cartItemsApi = createResource('cart-items')
export const conversationsApi = createResource('conversations')
export const chatMessagesApi = createResource('chat-messages')
export const getOrderforuserApi = createResource('getforuser')
export const getProfileApi = createResource('customerProfile')
// ---- Customer-only resources 
export const addressesApi = createResource('AddressUser')
export const ordersRecentApi = createResource('getOrderRecent')
export const notificationsUserApi = createResource('notificationUser')

// export const updateProfile


// ---- Admin-only resources (dashboard, staff, and deeper tables the storefront never touches) ----
export const ordersApi = createResource('Orders')
export const usersApi = createResource('users')
export const staffApi = createResource('staff')
export const userAddressAPI = createResource('getAddressCustomer');
// export const customerStatusApi = createResource('customers');
export const wishlistsApi = createResource('WishAdmin')
export const wishlistItemsApi = createResource('WishItemAdmin')
export const customerProfileApi = createResource('customer-profiles')
export const notificationsAdminApi = createResource('notificationAdmin')

//this block code for admin manages customer
export const addressesadminApi = createResource('AddressAdmin')
export const orderadminApi = createResource('getOrderCustomer')




export const productImagesApi = createResource('Product-image')
export const orderItemsApi = createResource('Order-item')
export const orderStatusHistoryApi = createResource('order-status-histories')
export const couponsApi = createResource('coupons')
export const couponUsagesApi = createResource('coupon-usages')
export const chatAttachmentsApi = createResource('chat-attachments')

export const dashboardApi = {
  stats(params = {}) { return client.get('/dashboard/stats', { params }) },
  salesChart(params = {}) { return client.get('/dashboard/sales-chart', { params }) },
}

export const productVariantsApi = {
  ...createResource('Product-variant'),
  removeImage(variantId, imageId) {
    return client.delete(`/Product-variant/${variantId}/image/${imageId}`)
  },
  setMainImage(variantId, imageId) {
    return client.patch(`/Product-variant/${variantId}/image/${imageId}/main`)
  },
}

export const productReviewsApi = createResource('Review')

// Extra one-off endpoints that don't fit the plain REST shape
export const authApi = {
  register(payload) { return client.post('/register', payload) },
  login(payload) { return client.post('/login', payload) },
  logout() { return client.post('/logout') },
  me() { return client.get('/me') },
  updateProfile(payload) { return client.put('/customer/profile', payload) },
  uploadAvatar(formData) {
    return client.post('/customer/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  updatePreferences(payload) { return client.put('/auth/preferences', payload) },
  deleteAccount(payload) { return client.post('/auth/account/delete', payload) },
  requestPasswordReset(email) { return client.post('/auth/password/forgot', { email }) },
}

export const customerStatusApi = {
    update(id, data) {
        return client.patch(`/customers/${id}/status`, data)
    }
}

export const checkoutApi = {
  applyCoupon(code, cartTotal) { return client.post('/checkout/apply-coupon', { code, cart_total: cartTotal }) },
  placeOrder(payload) { return client.post('/orders', payload) },
  // Card payments: create a payment intent/session before charging.
  // Expected response: { client_secret, provider: 'stripe'|'other', payment_id }
  createPaymentIntent(payload) { return client.post('/payments/create-intent', payload) },
  // Confirm a payment after the provider SDK completes on the client (card flow).
  confirmPayment(paymentId, payload) { return client.post(`/payments/${paymentId}/confirm`, payload) },
  // Poll order/payment status (used for bank transfer / async confirmations).
  getOrderStatus(orderId) { return client.get(`/orders/${orderId}/status`) },
}

export const productVariantsLookup = {
  // convenience for fetching a single product's variants if your API nests them separately
  list(productId) { return client.get(`/products/${productId}/variants`) },
}


