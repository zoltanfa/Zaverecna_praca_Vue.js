<script setup>
import { ref, onMounted } from 'vue'

const ORDER_STORAGE_KEY = 'orderHistory'
const orders = ref([])

const loadOrders = () => {
  try {
    const savedOrders = localStorage.getItem(ORDER_STORAGE_KEY)
    orders.value = savedOrders ? JSON.parse(savedOrders) : []
  } catch (error) {
    console.error('Failed to load order history:', error)
    orders.value = []
  }
}

const formatOrderDate = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const year = parsed.getFullYear()
    const hours = String(parsed.getHours()).padStart(2, '0')
    const minutes = String(parsed.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return typeof value === 'string' ? value : ''
}

onMounted(() => {
  loadOrders()
})
</script>


<template>
  <main class="main">
    <h1 class="main-title">Order History</h1>

    <div v-if="orders.length === 0" class="empty-state">
      <p>You have no previous orders.</p>
      <router-link to="/products" class="shop-link">Start Shopping</router-link>
    </div>

    <div v-else class="orders-list">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <div>
            <h2 class="order-title">Order #{{ order.id }}</h2>
            <p class="order-date">{{ formatOrderDate(order.date) }}</p>
          </div>
          <div class="order-total">{{ order.total.toFixed(2) }} €</div>
        </div>

        <div class="order-customer">
          <p><strong>Name:</strong> {{ order.customerName }}</p>
          <p><strong>Email:</strong> {{ order.email }}</p>
          <p><strong>Address:</strong> {{ order.address }}</p>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <span>{{ item.name }} x {{ item.quantity }}</span>
            <span>{{ (item.price * item.quantity).toFixed(2) }} €</span>
          </div>
        </div>
      </article>
    </div>
  </main>
</template>


<style scoped>
.main {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
}

.main-title {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 24px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.shop-link {
  display: inline-block;
  padding: 12px 24px;
  background-color: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  margin-top: 12px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
  padding: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.order-title {
  font-size: 18px;
  margin-bottom: 4px;
}

.order-date {
  color: #6b7280;
  font-size: 14px;
}

.order-total {
  font-size: 18px;
  font-weight: 600;
  color: #16a34a;
}

.order-customer {
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

@media (max-width: 768px) {
  .main {
    padding: 12px;
  }

  .main-title {
    font-size: 30px;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 8px;
  }

  .main-title {
    font-size: 24px;
  }

  .order-card {
    padding: 12px;
  }

  .order-item {
    font-size: 13px;
  }
}
</style>