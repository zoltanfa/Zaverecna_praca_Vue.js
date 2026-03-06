<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/ProductCard.vue'
import { products, loadProductsFromDatabase } from '@/data/products.js'
import { useSearch } from '@/composables/useSearch.js'

const route = useRoute()
const { searchTerm, matchesFullTextSearch, getSearchScore } = useSearch()
const selectedCategory = ref('')
const selectedSubcategories = ref([])
const selectedBrands = ref([])
const selectedSockets = ref([])
const selectedGpuModels = ref([])
const selectedRamSizes = ref([])
const selectedStorageFormats = ref([])
const selectedPsuWattages = ref([])
const selectedCaseFormFactors = ref([])
const selectedSort = ref('oldest')
const currentPage = ref(1)
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const productsPerPage = computed(() => {
  if (viewportWidth.value <= 480) {
    return 6
  }

  if (viewportWidth.value <= 768) {
    return 8
  }

  if (viewportWidth.value < 1095) {
    return 8
  }

  return 9
})
const minAvailablePrice = computed(() => {
  if (products.length === 0) {
    return 0
  }

  return Math.floor(Math.min(...products.map(product => product.price)))
})

const maxAvailablePrice = computed(() => {
  if (products.length === 0) {
    return 0
  }

  return Math.ceil(Math.max(...products.map(product => product.price)))
})

const selectedMinPrice = ref(0)
const selectedMaxPrice = ref(0)
const availableCategories = computed(() => {
  return [...new Set(products.map(product => product.category).filter(Boolean))]
})

const getProductSubcategory = (product) => product.subcategory
const getProductBrand = (product) => product.brand || product.name.split(' ')[0]
const socketCategories = ['CPU', 'Motherboard']
const gpuCategory = 'GPU'
const ramCategory = 'RAM'
const storageCategory = 'Storage'
const psuCategory = 'PSU'
const caseCategory = 'Case'

const getGpuModelDesignation = (product) => product.model
const getRamSize = (product) => product.size
const getStorageFormat = (product) => product.format
const getPsuWattage = (product) => product.wattage
const getCaseFormFactors = (product) => product.formFactors

const isSocketFilterVisible = computed(() => socketCategories.includes(selectedCategory.value))

const isGpuModelFilterVisible = computed(() => selectedCategory.value === gpuCategory)

const isRamSizeFilterVisible = computed(() => selectedCategory.value === ramCategory)

const isStorageFormatFilterVisible = computed(() => selectedCategory.value === storageCategory)

const isPsuWattageFilterVisible = computed(() => selectedCategory.value === psuCategory)

const isCaseFormFactorFilterVisible = computed(() => selectedCategory.value === caseCategory)

const availableSubcategories = computed(() => {
  if (!selectedCategory.value) {
    return []
  }

  const categoryFilteredProducts = products.filter(product =>
    product.category === selectedCategory.value
  )

  return [...new Set(categoryFilteredProducts.map(getProductSubcategory))]
})

watch(availableSubcategories, (subcategories) => {
  selectedSubcategories.value = selectedSubcategories.value.filter(subcategory =>
    subcategories.includes(subcategory)
  )
})

const availableBrands = computed(() => {
  if (!selectedCategory.value) {
    return []
  }

  let filtered = products.filter(product => product.category === selectedCategory.value)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  return [...new Set(filtered.map(getProductBrand))]
})

watch(availableBrands, (brands) => {
  selectedBrands.value = selectedBrands.value.filter(brand => brands.includes(brand))
})

const availableGpuModels = computed(() => {
  if (!isGpuModelFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => product.category === gpuCategory)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.map(getGpuModelDesignation))]
})

watch(availableGpuModels, (models) => {
  selectedGpuModels.value = selectedGpuModels.value.filter(model => models.includes(model))
})

const availableRamSizes = computed(() => {
  if (!isRamSizeFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => product.category === ramCategory)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.map(getRamSize))].sort((a, b) => a - b)
})

watch(availableRamSizes, (sizes) => {
  selectedRamSizes.value = selectedRamSizes.value.filter(size => sizes.includes(size))
})

const availableStorageFormats = computed(() => {
  if (!isStorageFormatFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => product.category === storageCategory)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.map(getStorageFormat))]
})

watch(availableStorageFormats, (formats) => {
  selectedStorageFormats.value = selectedStorageFormats.value.filter(format => formats.includes(format))
})

const availablePsuWattages = computed(() => {
  if (!isPsuWattageFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => product.category === psuCategory)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.map(getPsuWattage))].sort((a, b) => a - b)
})

watch(availablePsuWattages, (wattages) => {
  selectedPsuWattages.value = selectedPsuWattages.value.filter(wattage => wattages.includes(wattage))
})

const availableCaseFormFactors = computed(() => {
  if (!isCaseFormFactorFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => product.category === caseCategory)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.flatMap(getCaseFormFactors))]
})

watch(availableCaseFormFactors, (formFactors) => {
  selectedCaseFormFactors.value = selectedCaseFormFactors.value.filter(formFactor =>
    formFactors.includes(formFactor)
  )
})

const availableSockets = computed(() => {
  if (!isSocketFilterVisible.value) {
    return []
  }

  let filtered = products.filter(product => socketCategories.includes(product.category))
  filtered = filtered.filter(product => product.category === selectedCategory.value)

  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }

  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }

  return [...new Set(filtered.map(product => product.socket))]
})

watch(availableSockets, (sockets) => {
  selectedSockets.value = selectedSockets.value.filter(socket => sockets.includes(socket))
})

watch(selectedMinPrice, (price) => {
  if (price > selectedMaxPrice.value) {
    selectedMaxPrice.value = price
  }
})

watch(selectedMaxPrice, (price) => {
  if (price < selectedMinPrice.value) {
    selectedMinPrice.value = price
  }
})

watch([minAvailablePrice, maxAvailablePrice], ([minPrice, maxPrice]) => {
  if (selectedMinPrice.value === 0 && selectedMaxPrice.value === 0) {
    selectedMinPrice.value = minPrice
    selectedMaxPrice.value = maxPrice
    return
  }

  if (selectedMinPrice.value < minPrice || selectedMinPrice.value > maxPrice) {
    selectedMinPrice.value = minPrice
  }

  if (selectedMaxPrice.value > maxPrice || selectedMaxPrice.value < minPrice) {
    selectedMaxPrice.value = maxPrice
  }
}, { immediate: true })

onMounted(() => {
  loadProductsFromDatabase()

  const handleResize = () => {
    viewportWidth.value = window.innerWidth
  }

  window.addEventListener('resize', handleResize)
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })

  if (route.query.category) {
    selectedCategory.value = route.query.category
  }
})

const filteredProducts = computed(() => {
  let filtered = products
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.category === selectedCategory.value)
  }
  if (selectedSubcategories.value.length > 0) {
    filtered = filtered.filter(product => selectedSubcategories.value.includes(getProductSubcategory(product)))
  }
  if (selectedBrands.value.length > 0) {
    filtered = filtered.filter(product => selectedBrands.value.includes(getProductBrand(product)))
  }
  if (selectedGpuModels.value.length > 0) {
    filtered = filtered.filter(product => {
      if (product.category !== gpuCategory) {
        return true
      }

      return selectedGpuModels.value.includes(getGpuModelDesignation(product))
    })
  }
  if (selectedRamSizes.value.length > 0) {
    filtered = filtered.filter(product => {
      if (product.category !== ramCategory) {
        return true
      }

      return selectedRamSizes.value.includes(getRamSize(product))
    })
  }
  if (selectedStorageFormats.value.length > 0) {
    filtered = filtered.filter(product => {
      if (product.category !== storageCategory) {
        return true
      }

      return selectedStorageFormats.value.includes(getStorageFormat(product))
    })
  }
  if (selectedPsuWattages.value.length > 0) {
    filtered = filtered.filter(product => {
      if (product.category !== psuCategory) {
        return true
      }

      return selectedPsuWattages.value.includes(getPsuWattage(product))
    })
  }
  if (selectedCaseFormFactors.value.length > 0) {
    filtered = filtered.filter(product => {
      if (product.category !== caseCategory) {
        return true
      }

      return selectedCaseFormFactors.value.some(formFactor =>
        getCaseFormFactors(product).includes(formFactor)
      )
    })
  }
  if (selectedSockets.value.length > 0) {
    filtered = filtered.filter(product => {
      if (!socketCategories.includes(product.category)) {
        return true
      }

      return selectedSockets.value.includes(product.socket)
    })
  }
  if (searchTerm.value) {
    filtered = filtered.filter(product => matchesFullTextSearch(product, searchTerm.value))
  }
  filtered = filtered.filter(product =>
    product.price >= selectedMinPrice.value && product.price <= selectedMaxPrice.value
  )
  return filtered
})

const sortedProducts = computed(() => {
  const sorted = [...filteredProducts.value]
  const hasSearch = searchTerm.value.trim().length > 0

  if (hasSearch) {
    const scoredProducts = sorted.map(product => ({
      product,
      score: getSearchScore(product, searchTerm.value)
    }))

    scoredProducts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score
      }

      if (selectedSort.value === 'price-asc') {
        return a.product.price - b.product.price
      }

      if (selectedSort.value === 'price-desc') {
        return b.product.price - a.product.price
      }

      if (selectedSort.value === 'newest') {
        return b.product.id - a.product.id
      }

      return a.product.id - b.product.id
    })

    return scoredProducts.map(item => item.product)
  }

  if (selectedSort.value === 'newest') {
    return sorted.reverse()
  }

  if (selectedSort.value === 'oldest') {
    return sorted
  }

  if (selectedSort.value === 'price-asc') {
    return sorted.sort((a, b) => a.price - b.price)
  }

  if (selectedSort.value === 'price-desc') {
    return sorted.sort((a, b) => b.price - a.price)
  }

  return sorted
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(sortedProducts.value.length / productsPerPage.value))
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * productsPerPage.value
  const end = start + productsPerPage.value
  return sortedProducts.value.slice(start, end)
})

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, index) => index + 1)
})

const setPage = (page) => {
  currentPage.value = page
}

watch([filteredProducts, selectedSort, productsPerPage], () => {
  currentPage.value = 1
})
</script>


<template>
  <main class="main">
    <h1 class="main-title">All Products</h1>
    <div class="content">
      <aside class="filters">
        <h2 class="filters-title">Category</h2>
        <div class="filter-options">
          <label class="filter-option">
            <input type="radio" value="" v-model="selectedCategory" name="main-category"/>All Categories
          </label>
          <label v-for="category in availableCategories" :key="category" class="filter-option">
            <input 
              type="radio" :value="category" v-model="selectedCategory" name="main-category"/>{{ category }}
          </label>
        </div>
        <h2 v-if="selectedCategory" class="filters-title">Subcategory</h2>
        <div v-if="selectedCategory" class="filter-options">
          <label v-for="subcategory in availableSubcategories" :key="subcategory" class="filter-option">
            <input
              type="checkbox"
              :value="subcategory"
              v-model="selectedSubcategories"
            />{{ subcategory }}
          </label>
        </div>
        <h2 v-if="selectedCategory" class="filters-title">Brand</h2>
        <div v-if="selectedCategory" class="filter-options">
          <label v-for="brand in availableBrands" :key="brand" class="filter-option">
            <input
              type="checkbox"
              :value="brand"
              v-model="selectedBrands"
            />{{ brand }}
          </label>
        </div>
        <h2 v-if="isGpuModelFilterVisible" class="filters-title">GPU Model</h2>
        <div v-if="isGpuModelFilterVisible" class="filter-options">
          <label v-for="model in availableGpuModels" :key="model" class="filter-option">
            <input
              type="checkbox"
              :value="model"
              v-model="selectedGpuModels"
            />{{ model }}
          </label>
        </div>
        <h2 v-if="isRamSizeFilterVisible" class="filters-title">RAM Size</h2>
        <div v-if="isRamSizeFilterVisible" class="filter-options">
          <label v-for="size in availableRamSizes" :key="size" class="filter-option">
            <input
              type="checkbox"
              :value="size"
              v-model="selectedRamSizes"
            />{{ size }} GB
          </label>
        </div>
        <h2 v-if="isStorageFormatFilterVisible" class="filters-title">Format</h2>
        <div v-if="isStorageFormatFilterVisible" class="filter-options">
          <label v-for="format in availableStorageFormats" :key="format" class="filter-option">
            <input
              type="checkbox"
              :value="format"
              v-model="selectedStorageFormats"
            />{{ format }}
          </label>
        </div>
        <h2 v-if="isPsuWattageFilterVisible" class="filters-title">PSU Wattage</h2>
        <div v-if="isPsuWattageFilterVisible" class="filter-options">
          <label v-for="wattage in availablePsuWattages" :key="wattage" class="filter-option">
            <input
              type="checkbox"
              :value="wattage"
              v-model="selectedPsuWattages"
            />{{ wattage }} W
          </label>
        </div>
        <h2 v-if="isCaseFormFactorFilterVisible" class="filters-title">Case Form Factor</h2>
        <div v-if="isCaseFormFactorFilterVisible" class="filter-options">
          <label v-for="formFactor in availableCaseFormFactors" :key="formFactor" class="filter-option">
            <input
              type="checkbox"
              :value="formFactor"
              v-model="selectedCaseFormFactors"
            />{{ formFactor }}
          </label>
        </div>
          <h2 v-if="isSocketFilterVisible" class="filters-title">Socket</h2>
          <div v-if="isSocketFilterVisible" class="filter-options">
            <label v-for="socket in availableSockets" :key="socket" class="filter-option">
              <input
                type="checkbox"
                :value="socket"
                v-model="selectedSockets"
              />{{ socket }}
            </label>
          </div>
        <h2 class="filters-title">Price</h2>
        <div class="price-filter">
          <label class="price-label">Min: {{ selectedMinPrice.toFixed(2) }} €</label>
          <input
            type="range"
            :min="minAvailablePrice"
            :max="selectedMaxPrice"
            step="1"
            v-model.number="selectedMinPrice"
            class="price-slider"
          />
          <label class="price-label">Max: {{ selectedMaxPrice.toFixed(2) }} €</label>
          <input
            type="range"
            :min="selectedMinPrice"
            :max="maxAvailablePrice"
            step="1"
            v-model.number="selectedMaxPrice"
            class="price-slider"
          />
          <p class="price-value">{{ selectedMinPrice.toFixed(2) }} € - {{ selectedMaxPrice.toFixed(2) }} €</p>
        </div>
      </aside>
      <div class="products-section">
        <div class="sort-row">
          <label for="sort-select" class="sort-label">Sort by:</label>
          <select id="sort-select" v-model="selectedSort" class="sort-select">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Least expensive</option>
            <option value="price-desc">Most expensive</option>
          </select>
        </div>
        <div class="product-grid">
          <ProductCard v-for="product in paginatedProducts" :key="product.id" :product="product" />
        </div>
        <div v-if="sortedProducts.length > 0" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="setPage(currentPage - 1)"
          >
            Prev
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            class="page-btn"
            :class="{ active: page === currentPage }"
            @click="setPage(page)"
          >
            {{ page }}
          </button>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="setPage(currentPage + 1)"
          >
            Next
          </button>
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

.filters-title + .filter-options + .filters-title {
  margin-top: 20px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-slider {
  width: 100%;
}

.price-label {
  font-size: 14px;
}

.price-value {
  margin: 0;
  font-weight: 600;
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

.sort-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.sort-label {
  font-weight: 600;
}

.sort-select {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  background-color: #fff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 250px));
  justify-content: start;
  gap: 16px;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.page-btn {
  border: 1px solid #d1d5db;
  background-color: #fff;
  color: #111827;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn.active {
  background-color: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  }

  .products-section {
    width: 100%;
  }

  .sort-row {
    margin-bottom: 12px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-content: stretch;
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
    grid-template-columns: 1fr;
    justify-content: stretch;
    gap: 12px;
  }
}
</style>