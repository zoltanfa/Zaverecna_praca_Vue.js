<script setup>
import { computed } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import { products } from '@/data/products.js'
import { useSearch } from '@/composables/useSearch.js'

const { searchTerm } = useSearch()
const featuredProducts = computed(() => {
  let featured = products.filter(product => [1, 2, 6, 11, 16, 21].includes(product.id))
  if (searchTerm.value) {
    featured = featured.filter(product => product.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
  }
  return featured
})
</script>


<template>
  <main class="main">
    <h1 class="main-title">Welcome to PC Component Shop</h1>
    <p class="main-description">Find the best PC components for your build.</p>
    <section class="featured-section">
      <h2 class="section-title">Featured Products</h2>
      <div class="product-grid">
        <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
      </div>
    </section>
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

.main-title {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 16px;
}

.main-description {
  margin-bottom: 32px;
}

.featured-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .main {
    padding: 12px;
  }

  .main-title {
    font-size: 30px;
  }

  .section-title {
    font-size: 20px;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 480px) {
  .main {
    padding: 8px;
  }

  .main-title {
    font-size: 24px;
  }

  .main-description {
    font-size: 14px;
  }

  .section-title {
    font-size: 18px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>