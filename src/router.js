import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/products', name: 'Products', component: () => import('@/views/Products.vue') },
  { path: '/product/:id', name: 'ProductDetail', component: () => import('@/views/ProductDetail.vue') },
  { path: '/cart', name: 'Cart', component: () => import('@/views/Cart.vue') },
  { path: '/checkout', name: 'Checkout', component: () => import('@/views/Checkout.vue'), meta: { requiresAuth: true } },
  { path: '/orders', name: 'OrderHistory', component: () => import('@/views/OrderHistory.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/Register.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: () => import('@/views/Admin.vue'), meta: { requiresAuth: true, requiresRole: 'admin' } }
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