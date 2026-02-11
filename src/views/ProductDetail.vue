<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { products } from '@/data/products.js'
import { useCart } from '@/composables/useCart.js'

const route = useRoute()
const router = useRouter()
const product = computed(() => products.find(p => p.id === parseInt(route.params.id)))

const { addToCart } = useCart()
const handleAddToCart = () => {
  addToCart(product.value)
}

const showSameCategory = () => {
  router.push(`/products?category=${product.value.category}`)
}
</script>


<template>
    <main class="main">
      <div v-if="product" class="product-detail">
        <img :src="product.image" :alt="product.name" class="product-detail-image" />
        <div class="product-detail-info">
          <h1 class="product-detail-title">{{ product.name }}</h1>
          <p class="product-detail-price">{{ product.price }} €</p>
          <p class="product-detail-description">{{ product.description }}</p>
          <button @click="handleAddToCart" class="add-to-cart-btn">🛒 Add to Cart</button>
          <button @click="showSameCategory" class="category-btn">Show {{ product.category }} Products</button>
        </div>
      </div>
      <p v-else>Product not found.</p>
    </main>
</template>


<style scoped>
.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.product-detail {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .product-detail {
    flex-direction: row;
  }
}

.product-detail-image {
  width: 400px;
  height: 400px;
  object-fit: contain;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .product-detail-image {
    width: 50%;
    margin-bottom: 0;
    margin-right: 32px;
  }
}

.product-detail-info {
  flex: 1;
}

.product-detail-title {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 8px;
}

.product-detail-price {
  font-size: 20px;
  color: #16a34a;
  margin-bottom: 16px;
}

.product-detail-description {
  margin-bottom: 16px;
}

.add-to-cart-btn {
  display: block;
  width: 250px;
  background-color: #2563eb;
  color: white;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 16px;
  font-weight: 500;
}

.add-to-cart-btn:hover {
  background-color: #1d4ed8;
}

.add-to-cart-btn:active {
  background-color: #afb0b3;
}

.category-btn {
  display: block;
  width: 250px;
  background-color: #6b7280;
  color: white;
  padding: 12px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 8px;
  font-size: 16px;
  font-weight: 500;
}

.category-btn:hover {
  background-color: #4b5563;
}

.category-btn:active {
  background-color: #afb0b3;
}

@media (max-width: 768px) {
  .product-detail-image {
    width: 100%;
    height: 300px;
  }

  .product-detail-title {
    font-size: 24px;
  }

  .add-to-cart-btn,
  .category-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .product-detail-image {
    height: 200px;
  }

  .product-detail-title {
    font-size: 20px;
  }

  .product-detail-price {
    font-size: 18px;
  }
}
</style>