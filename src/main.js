import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router.js'
import { useAuth } from '@/composables/useAuth.js'
import { loadProductsFromDatabase } from '@/data/products.js'

const { initAuth } = useAuth()
initAuth()
loadProductsFromDatabase()

createApp(App).use(router).mount('#app')
