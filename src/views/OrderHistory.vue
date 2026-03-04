<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { products, loadProductsFromDatabase } from '@/data/products.js'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'

const ORDER_STATUS_STAGES = ['Created', 'Processed', 'Shipped']
const orders = ref([])
const selectedOrderId = ref(null)
const { currentUser, waitForAuthInit } = useAuth()

const selectedOrder = computed(() => (
  orders.value.find(order => order.id === selectedOrderId.value) || null
))

const loadOrders = () => {
  orders.value = []
}

const loadOrdersFromFirestore = async () => {
  try {
    await waitForAuthInit()

    if (!currentUser.value) {
      loadOrders()
      return
    }

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', currentUser.value.uid)
    )

    const snapshot = await getDocs(ordersQuery)
    const mappedOrders = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data()
      const createdAtDate = data.createdAt?.toDate?.()

      return {
        id: docSnapshot.id,
        ...data,
        date: createdAtDate ? createdAtDate.toISOString() : null,
        createdAtMs: createdAtDate ? createdAtDate.getTime() : 0
      }
    })

    orders.value = mappedOrders.sort((a, b) => b.createdAtMs - a.createdAtMs)
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

const getOrderItemsCount = (order) => {
  if (!order?.items?.length) {
    return 0
  }

  return order.items.reduce((count, item) => count + (item.quantity || 0), 0)
}

const openOrderDetails = (orderId) => {
  selectedOrderId.value = orderId
}

const closeOrderDetails = () => {
  selectedOrderId.value = null
}

const getOrderItemImage = (item) => {
  const product = products.find(productEntry => productEntry.id === item.id)
  return product?.image || ''
}

const getOrderStatus = (order) => {
  if (ORDER_STATUS_STAGES.includes(order?.status)) {
    return order.status
  }

  if (!order?.date) {
    return 'Created'
  }

  const createdAt = new Date(order.date)
  if (Number.isNaN(createdAt.getTime())) {
    return 'Created'
  }

  const elapsedMs = Date.now() - createdAt.getTime()
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)

  if (elapsedDays < 1) {
    return 'Created'
  }

  if (elapsedDays < 3) {
    return 'Processed'
  }

  return 'Shipped'
}

onMounted(() => {
  loadProductsFromDatabase()
  loadOrdersFromFirestore()
})
</script>


<template>
  <main class="main">
    <h1 class="main-title">Order History</h1>

    <div v-if="orders.length === 0" class="empty-state">
      <p>You have no previous orders.</p>
      <router-link to="/products" class="shop-link">Start Shopping</router-link>
    </div>

    <div v-else-if="!selectedOrder" class="orders-list">
      <button
        v-for="order in orders"
        :key="order.id"
        type="button"
        class="order-card order-card-btn"
        @click="openOrderDetails(order.id)"
      >
        <div class="order-header">
          <div>
            <h2 class="order-title">Order #{{ order.id }}</h2>
            <p class="order-date">{{ formatOrderDate(order.date) }}</p>
          </div>
          <div class="order-total">{{ order.total.toFixed(2) }} €</div>
        </div>
        <div class="order-preview">
          <span>{{ getOrderItemsCount(order) }} items</span>
          <span class="order-status">{{ getOrderStatus(order) }}</span>
        </div>
      </button>
    </div>

    <div v-else class="order-detail-view">
      <button type="button" class="back-btn" @click="closeOrderDetails">← Back to Orders</button>

      <article class="order-card">
        <div class="order-header">
          <div>
            <h2 class="order-title">Order #{{ selectedOrder.id }}</h2>
            <p class="order-date">{{ formatOrderDate(selectedOrder.date) }}</p>
            <div class="order-date-status">
              <span class="order-status">{{ getOrderStatus(selectedOrder) }}</span>
            </div>
          </div>
          <div class="order-total">{{ selectedOrder.total.toFixed(2) }} €</div>
        </div>

        <div class="order-customer">
          <p><strong>Name:</strong> {{ selectedOrder.customerName || '—' }}</p>
          <p><strong>Email:</strong> {{ selectedOrder.email || '—' }}</p>
          <p><strong>Address:</strong> {{ selectedOrder.address || '—' }}</p>
          <p><strong>Delivery:</strong> {{ selectedOrder.deliveryLabel || selectedOrder.deliveryMethod || '—' }}</p>
          <p><strong>Payment:</strong> {{ selectedOrder.paymentLabel || selectedOrder.paymentMethod || '—' }}</p>
          <p v-if="selectedOrder.pickupPoint"><strong>Pickup point:</strong> {{ selectedOrder.pickupPoint }}</p>
        </div>

        <div class="order-items">
          <div v-for="item in selectedOrder.items" :key="item.id" class="order-item">
            <div class="order-item-main">
              <img
                v-if="getOrderItemImage(item)"
                :src="getOrderItemImage(item)"
                :alt="item.name"
                class="order-item-image"
              />
              <div class="order-item-info">
                <span>{{ item.name }}</span>
                <small>Qty: {{ item.quantity }}</small>
              </div>
            </div>
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

.order-card-btn {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.order-card-btn:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.order-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #6b7280;
}

.order-status {
  color: #1d4ed8;
  background-color: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 9999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.order-detail-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-btn {
  align-self: flex-start;
  border: 1px solid #d1d5db;
  background-color: white;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  color: #374151;
}

.back-btn:hover {
  background-color: #f3f4f6;
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

.order-date-status {
  margin-top: 6px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.order-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.order-item-image {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.order-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.order-item-info span {
  color: #1f2937;
}

.order-item-info small {
  color: #6b7280;
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
    align-items: flex-start;
  }

  .order-item-main {
    gap: 8px;
  }

  .order-item-image {
    width: 40px;
    height: 40px;
  }

  .order-preview {
    font-size: 13px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .order-status {
    font-size: 11px;
  }
}
</style>