import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import { useCartStore } from './stores/cart'
import { useNotificationStore } from './stores/notifications'

const app = createApp(App)
app.use(createPinia())
app.use(router)

useThemeStore().initTheme()

const auth = useAuthStore()
if (auth.isAuthenticated) {
  auth.fetchProfile().catch(() => {})
  if (auth.isDashboardUser) {
    // Admin/staff: no shopping cart or customer notification feed to boot.
  } else {
    useNotificationStore().init()
  }
}
// Cart only matters for the storefront. A dashboard user browsing /admin
// doesn't need a guest/customer cart record created on their behalf.
if (!auth.isDashboardUser) {
  useCartStore().init()
}

app.mount('#app')
