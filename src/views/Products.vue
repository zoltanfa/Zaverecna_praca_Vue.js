<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { products } from '@/data/products.js'
import { useSearch } from '@/composables/useSearch.js'

const route = useRoute()
const { searchTerm } = useSearch()
const selectedCategories = ref([])
const availableCategories = [
  'CPU',
  'GPU', 
  'Motherboard',
  'RAM',
  'Storage',
  'PSU',
  'Case'
]

onMounted(() => {
  if (route.query.category) {
    selectedCategories.value = [route.query.category]
  }
})

const filteredProducts = computed(() => {
  let filtered = products
  if (selectedCategories.value.length > 0) {
    filtered = filtered.filter(product => selectedCategories.value.includes(product.category))
  }
  if (searchTerm.value) {
    filtered = filtered.filter(product => product.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
  }
  return filtered
})
</script>


<template>
  <main class="main">
    <h1 class="main-title">All Products</h1>
    <div class="content">
      <aside class="filters">
        <h2 class="filters-title">Filter by Category</h2>
        <div class="filter-options">
          <label v-for="category in availableCategories" :key="category" class="filter-option">
            <input 
              type="checkbox" :value="category" v-model="selectedCategories"/>{{ category }}
          </label>
        </div>
      </aside>
      <div class="products-section">
        <div class="product-grid">
          <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </div>
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

.content {
  display: flex;
  gap: 32px;
  width: 100%;
  box-sizing: border-box;
}

.filters {
  width: 250px;
  flex-shrink: 0;
}

.filters-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.filter-option input[type="checkbox"] {
  margin: 0;
}

.products-section {
  flex: 1;
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

  .content {
    flex-direction: column;
    gap: 12px;
  }

  .filters {
    width: 100%;
    order: 1;
  }

  .products-section {
    width: 100%;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }

  .filters-title {
    font-size: 16px;
  }

  .filter-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>