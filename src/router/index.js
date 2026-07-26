import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // ================= STOREFRONT (public / customer) =================
  { path: '/', name: 'home', component: () => import('@/views/Home.vue') },
  { path: '/shop', name: 'shop', component: () => import('@/views/Shop.vue') },
  { path: '/product/:slug', name: 'product-detail', component: () => import('@/views/ProductDetail.vue') },
  { path: '/category/:slug', name: 'category', component: () => import('@/views/Shop.vue') },
  { path: '/track-order', name: 'track-order', component: () => import('@/views/TrackOrder.vue') },
  { path: '/about', name: 'about', component: () => import('@/views/static/About.vue') },
  { path: '/contact', name: 'contact', component: () => import('@/views/static/Contact.vue') },

  // Single login/register for the whole app. The login page itself shows an
  // "Admin / Staff" toggle only when relevant — see views/auth/Login.vue.
  { path: '/login', name: 'login', component: () => import('@/views/auth/Login.vue'), meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('@/views/auth/Register.vue'), meta: { guestOnly: true } },

  { path: '/cart', name: 'cart', component: () => import('@/views/Cart.vue') },
  { path: '/checkout', name: 'checkout', component: () => import('@/views/Checkout.vue'), meta: { requiresAuth: true } },
  { path: '/order-confirmation/:id', name: 'order-confirmation', component: () => import('@/views/OrderConfirmation.vue'), meta: { requiresAuth: true } },

  {
    path: '/account',
    component: () => import('@/layouts/AccountLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'account-overview', component: () => import('@/views/account/Overview.vue') },
      { path: 'orders', name: 'account-orders', component: () => import('@/views/account/Orders.vue') },
      { path: 'orders/:id', name: 'account-order-detail', component: () => import('@/views/account/OrderDetail.vue') },
      { path: 'wishlist', name: 'account-wishlist', component: () => import('@/views/account/Wishlist.vue') },
      { path: 'addresses', name: 'account-addresses', component: () => import('@/views/account/Addresses.vue') },
      { path: 'notifications', name: 'account-notifications', component: () => import('@/views/account/Notifications.vue') },
      { path: 'profile', name: 'account-profile', component: () => import('@/views/account/Profile.vue') },
      { path: 'support', name: 'account-support', component: () => import('@/views/account/Support.vue') },
    ],
  },

  // Dedicated dashboard sign-in, separate from the storefront /login so
  // customers never see an "Admin / Staff" toggle. Not linked from customer
  // nav; reachable directly (e.g. /admin/login) or via redirect below.
  { path: '/admin/login', name: 'admin-login', component: () => import('@/views/admin/auth/AdminLogin.vue'), meta: { guestOnly: true } },

  // ================= ADMIN DASHBOARD (role: admin | staff) =================
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresDashboard: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('@/views/admin/Dashboard.vue') },

      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/products/ProductList.vue') },
      { path: 'products/variants', name: 'admin-product-variants', component: () => import('@/views/admin/products/ProductVariants.vue') },
      { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/products/Categories.vue') },
      { path: 'brands', name: 'admin-brands', component: () => import('@/views/admin/products/Brands.vue') },
      { path: 'reviews', name: 'admin-reviews', component: () => import('@/views/admin/products/Reviews.vue') },

      { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/orders/OrderList.vue') },
      { path: 'orders/:id', name: 'admin-order-detail', component: () => import('@/views/admin/orders/OrderDetail.vue') },
      { path: 'orders/:id/history', name: 'admin-order-status-history', component: () => import('@/views/admin/orders/OrderStatusHistory.vue') },

      { path: 'customers', name: 'admin-customers', component: () => import('@/views/admin/customers/CustomerList.vue') },
      { path: 'customers/:id', name: 'admin-customer-detail', component: () => import('@/views/admin/customers/CustomerDetail.vue') },
      { path: 'addresses', name: 'admin-addresses', component: () => import('@/views/admin/customers/Addresses.vue') },

      { path: 'coupons', name: 'admin-coupons', component: () => import('@/views/admin/marketing/Coupons.vue') },
      { path: 'coupons/usages', name: 'admin-coupon-usages', component: () => import('@/views/admin/marketing/CouponUsages.vue') },
      { path: 'wishlists', name: 'admin-wishlists', component: () => import('@/views/admin/marketing/Wishlists.vue') },
      { path: 'carts', name: 'admin-carts', component: () => import('@/views/admin/marketing/Carts.vue') },

      { path: 'reports', name: 'admin-reports', component: () => import('@/views/admin/reports/SalesReports.vue') },

      { path: 'chat', name: 'admin-chat', component: () => import('@/views/admin/support/ChatConsole.vue') },
      { path: 'notifications', name: 'admin-notifications', component: () => import('@/views/admin/support/Notifications.vue') },

      {
        path: 'staff',
        name: 'admin-staff',
        component: () => import('@/views/admin/admin/StaffManagement.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/views/admin/admin/Settings.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Unauthenticated visit to an admin route -> dedicated admin login (keeps
  // the redirect target intact so it lands them back where they aimed).
  if (to.meta.requiresAuth && to.path.startsWith('/admin') && !auth.isAuthenticated) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    // Send a signed-in dashboard user back to /admin, a signed-in customer to their account.
    // (This also covers a dashboard user accidentally landing on /login, and
    // a customer accidentally landing on /admin/login.)
    return next(auth.isDashboardUser ? { name: 'admin-dashboard' } : { name: 'account-overview' })
  }

  // Gate the whole /admin subtree to admin/staff accounts. A customer who is
  // signed in but hits /admin/* gets bounced to the storefront home, not the
  // login screen — they ARE authenticated, they just don't have a dashboard seat.
  if (to.meta.requiresDashboard && !auth.isDashboardUser) {
    return next({ name: 'home' })
  }

  // Staff-only exceptions inside /admin (Staff Management, Settings)
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return next({ name: 'admin-dashboard' })
  }

  next()
})

export default router
