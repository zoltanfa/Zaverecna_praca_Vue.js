<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCart } from '@/composables/useCart.js'
import { useSearch } from '@/composables/useSearch.js'
import { useAuth } from '@/composables/useAuth.js'
import { useRouter } from 'vue-router'

const { totalItems } = useCart()
const { searchTerm } = useSearch()
const { currentUser, isAdmin, logout } = useAuth()
const router = useRouter()
const accountMenuOpen = ref(false)
const accountMenuRef = ref(null)

const goToProducts = () => {
  router.push('/products')
}

const toggleAccountMenu = () => {
  accountMenuOpen.value = !accountMenuOpen.value
}

const closeAccountMenu = () => {
  accountMenuOpen.value = false
}

const handleClickOutside = (event) => {
  if (!accountMenuRef.value) {
    return
  }

  if (!accountMenuRef.value.contains(event.target)) {
    closeAccountMenu()
  }
}

const handleLogout = async () => {
  await logout()
  closeAccountMenu()
  router.push('/')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
        <div ref="accountMenuRef" class="account-menu">
          <button
            type="button"
            class="account-btn"
            aria-label="Account menu"
            @click.stop="toggleAccountMenu"
          >
            Account
          </button>

          <div v-if="accountMenuOpen" class="account-dropdown">
            <template v-if="currentUser">
              <router-link v-if="isAdmin" to="/admin" class="account-link" @click="closeAccountMenu">Admin</router-link>
              <router-link to="/profile" class="account-link" @click="closeAccountMenu">Profile</router-link>
              <button type="button" class="account-link account-action" @click="handleLogout">Logout</button>
            </template>
            <template v-else>
              <router-link to="/login" class="account-link" @click="closeAccountMenu">Login</router-link>
              <router-link to="/register" class="account-link" @click="closeAccountMenu">Register</router-link>
            </template>
          </div>
        </div>
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

nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  margin-right: 0;
  color: white;
  text-decoration: none;
  font-size: 16px;
  display: inline-block;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.12);
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

.cart-link {
  position: relative;
}

.account-menu {
  position: relative;
  display: inline-block;
}

.account-btn {
  border: none;
  background-color: transparent;
  color: white;
  border-radius: 6px;
  min-height: auto;
  padding: 6px 10px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;
  transition: background-color 0.2s;
}

.account-btn:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.account-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 130px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 10;
}

.account-link {
  display: block;
  width: 100%;
  border: none;
  background-color: white;
  text-align: left;
  padding: 10px 12px;
  color: #1f2937;
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
}

.account-link:hover {
  background-color: #f3f4f6;
}

.account-action {
  font-family: inherit;
}

.cart-count {
  position: absolute;
  top: -9px;
  right: -8px;
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
    right: -8px;
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