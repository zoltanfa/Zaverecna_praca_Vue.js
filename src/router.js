import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Products from '@/views/Products.vue'
import ProductDetail from '@/views/ProductDetail.vue'
import Cart from '@/views/Cart.vue'
import Checkout from '@/views/Checkout.vue'
import OrderHistory from '@/views/OrderHistory.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/views/Profile.vue'
import Admin from '@/views/Admin.vue'
import { useAuth } from '@/composables/useAuth.js'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/products', name: 'Products', component: Products },
  { path: '/product/:id', name: 'ProductDetail', component: ProductDetail },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/checkout', name: 'Checkout', component: Checkout, meta: { requiresAuth: true } },
  { path: '/orders', name: 'OrderHistory', component: OrderHistory, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: Admin, meta: { requiresAuth: true, requiresRole: 'admin' } }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to) => {
  const { currentUser, isAdmin, waitForAuthInit } = useAuth()
  await waitForAuthInit()

  if (to.meta.requiresAuth && !currentUser.value) {
    return { name: 'Login' }
  }

  if ((to.name === 'Login' || to.name === 'Register') && currentUser.value) {
    return { name: 'Home' }
  }

  if (to.meta.requiresRole === 'admin' && !isAdmin.value) {
    return { name: 'Home' }
  }

  return true
})

export default router