import { ref, computed, watch } from 'vue'
import { products } from '@/data/products.js'

const CART_STORAGE_KEY = 'cart'

const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    return savedCart ? JSON.parse(savedCart) : []
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error)
    return []
  }
}

const cart = ref(loadCartFromStorage())

const getLiveProductById = (productId) => {
  return products.find(product => String(product.id) === String(productId)) || null
}

const getAvailableUnits = (product) => {
  const liveProduct = getLiveProductById(product?.id)
  const sourceProduct = liveProduct || product

  if (typeof sourceProduct?.stock === 'number') {
    return Math.max(0, sourceProduct.stock)
  }

  if (typeof sourceProduct?.inStock === 'boolean') {
    return sourceProduct.inStock ? Number.POSITIVE_INFINITY : 0
  }

  return Number.POSITIVE_INFINITY
}

const isProductAvailable = (product) => {
  return getAvailableUnits(product) > 0
}

watch(
  () => cart.value,
  (newCart) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  },
  { deep: true }
)

const addToCart = (product) => {
  if (!product || !isProductAvailable(product)) {
    return false
  }

  const existingItemIndex = cart.value.findIndex(item => item.id === product.id)

  if (existingItemIndex > -1) {
    const currentQuantity = cart.value[existingItemIndex].quantity
    const maxAvailableUnits = getAvailableUnits(product)

    if (currentQuantity >= maxAvailableUnits) {
      return false
    }

    cart.value = cart.value.map((item, index) =>
      index === existingItemIndex
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  } else {
    cart.value = [...cart.value, {
      ...product,
      quantity: 1
    }]
  }

  return true
}

const removeFromCart = (productId) => {
  cart.value = cart.value.filter(item => item.id !== productId)
}

const updateQuantity = (productId, quantity) => {
  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }

  const itemToUpdate = cart.value.find(item => item.id === productId)
  if (!itemToUpdate) {
    return
  }

  const maxAvailableUnits = getAvailableUnits(itemToUpdate)
  const nextQuantity = Math.min(quantity, maxAvailableUnits)

  if (nextQuantity <= 0) {
    removeFromCart(productId)
    return
  }

  cart.value = cart.value.map(item => 
    item.id === productId 
      ? { ...item, quantity: nextQuantity }
      : item
  )
}

const clearCart = () => {
  cart.value = []
}

const totalItems = computed(() => {
  return cart.value.reduce((total, item) => total + item.quantity, 0)
})

const totalPrice = computed(() => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

export function useCart() {
  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isProductAvailable,
    getAvailableUnits
  }
}