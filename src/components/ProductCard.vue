<script setup>
import { computed } from 'vue'
import { useCart } from '@/composables/useCart.js'

const { product } = defineProps({
  product: Object
})

const { addToCart, isProductAvailable } = useCart()
const isAvailable = computed(() => isProductAvailable(product))

const handleAddToCart = () => {
  addToCart(product)
}
</script>


<template>
  <div class="product-card">
    <router-link :to="`/product/${product.id}`" class="product-link">
      <img :src="product.image" :alt="product.name" class="product-image" />
      <h3 class="product-title">{{ product.name }}</h3>
    </router-link>
    <div class="product-footer">
      <p class="product-price">{{ product.price.toFixed(2) }} €</p>
      <p class="stock-status" :class="{ 'out-of-stock': !isAvailable }">
        {{ isAvailable ? 'In stock' : 'Out of stock' }}
      </p>
      <button @click="handleAddToCart" class="add-to-cart-btn" :disabled="!isAvailable">
        {{ isAvailable ? '🛒 Add to Cart' : 'Unavailable' }}
      </button>
    </div>
  </div>
</template>


<style scoped>
.product-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.product-image {
  width: 100%;
  height: 250px;
  object-fit: contain;
  margin: 10px 0 0 0;
}

.product-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.product-price {
  color: #16a34a;
}

.stock-status {
  margin: 0 0 8px 0;
  color: #15803d;
  font-size: 14px;
  font-weight: 600;
}

.stock-status.out-of-stock {
  color: #dc2626;
}

.product-link {
  display: block;
  color: inherit;
  text-decoration: none;
  margin-bottom: 8px;
}

.product-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
}

.add-to-cart-btn {
  display: block;
  width: 100%;
  background-color: #2563eb;
  color: white;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-to-cart-btn:hover {
  background-color: #1d4ed8;
}

.add-to-cart-btn:active {
  background-color: #afb0b3;
}

.add-to-cart-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .product-card {
    padding: 12px;
  }

  .product-image {
    height: 200px;
  }

  .product-title {
    font-size: 16px;
  }

  .add-to-cart-btn {
    padding: 10px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .product-card {
    padding: 10px;
  }

  .product-image {
    height: 150px;
  }

  .product-title {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .product-price {
    font-size: 14px;
  }

  .add-to-cart-btn {
    padding: 8px 10px;
    font-size: 12px;
  }
}
</style>