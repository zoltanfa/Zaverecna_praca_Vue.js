<script setup>
import { useCart } from '@/composables/useCart.js'
import { useSearch } from '@/composables/useSearch.js'
import { useRouter } from 'vue-router'

const { totalItems } = useCart()
const { searchTerm } = useSearch()
const router = useRouter()

const goToProducts = () => {
  router.push('/products')
}
</script>


<template>
  <header class="header">
    <div class="header-container">
      <router-link to="/" class="logo">PC Shop</router-link>
      <div class="search-container">
        <input v-model="searchTerm" type="text" placeholder="Search products..." class="search-input" @keydown.enter="goToProducts" />
      </div>
      <nav>
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/products" class="nav-link">Products</router-link>
        <router-link to="/orders" class="nav-link">Orders</router-link>
        <router-link to="/cart" class="nav-link cart-link">Cart<span v-if="totalItems > 0" class="cart-count">{{ totalItems }}</span></router-link>
      </nav>
    </div>
  </header>
</template>


<style scoped>
.header {
  background-color: #2563eb;
  color: white;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.header-container {
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.logo {
  font-size: 25px;
  font-weight: bold;
  color: white;
  text-decoration: none;
  white-space: nowrap;
}

.nav-link {
  margin-right: 20px;
  color: white;
  text-decoration: none;
  font-size: 16px;
}

.search-container {
  flex: 1;
  max-width: 400px;
  margin: 0 20px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  min-height: 36px;
}

.nav-link:last-child {
  margin-right: 0;
}

.cart-link {
  position: relative;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -16px;
  background-color: #dc2626;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .header {
    padding: 12px 16px;
    min-height: 60px;
  }

  .header-container {
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .logo {
    font-size: 20px;
    order: 1;
    display: flex;
    align-items: center;
    min-height: 40px;
  }

  nav {
    order: 2;
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: auto;
  }

  .search-container {
    flex: 1 1 100%;
    max-width: none;
    margin-top: 4px;
    order: 3;
  }

  .nav-link {
    margin-right: 0;
    font-size: 16px;
    padding: 4px 8px;
  }

  .cart-count {
    top: -12px;
    right: -12px;
    width: 18px;
    height: 18px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 10px 12px;
    min-height: 56px;
  }

  .header-container {
    gap: 6px;
  }

  .logo {
    font-size: 18px;
    min-height: 36px;
  }

  nav {
    min-height: 36px;
  }

  .search-input {
    padding: 6px 8px;
    font-size: 13px;
  }

  .nav-link {
    font-size: 16px;
    padding: 2px 6px;
  }

  .search-container {
    margin: 8px 0 0 0;
  }
}
</style>