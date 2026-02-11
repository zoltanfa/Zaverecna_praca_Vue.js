import { ref, computed, watch } from 'vue'

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
  const existingItemIndex = cart.value.findIndex(item => item.id === product.id)
  if (existingItemIndex > -1) {
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
}

const removeFromCart = (productId) => {
  cart.value = cart.value.filter(item => item.id !== productId)
}

const updateQuantity = (productId, quantity) => {
  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }
  cart.value = cart.value.map(item => 
    item.id === productId 
      ? { ...item, quantity }
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
    totalPrice
  }
}