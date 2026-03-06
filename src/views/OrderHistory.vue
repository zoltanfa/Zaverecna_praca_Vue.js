<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { products, loadProductsFromDatabase } from '@/data/products.js'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'

const ORDER_STATUS_STAGES = ['Created', 'Processed', 'Shipped', 'Delivered', 'Cancelled']
const CANCELLABLE_ORDER_STATUSES = ['Created', 'Processed']
const orders = ref([])
const selectedOrderId = ref(null)
const isCancellingOrder = ref(false)
const cancelErrorMessage = ref('')
const cancelSuccessMessage = ref('')
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
  cancelErrorMessage.value = ''
  cancelSuccessMessage.value = ''
  selectedOrderId.value = orderId
}

const closeOrderDetails = () => {
  cancelErrorMessage.value = ''
  cancelSuccessMessage.value = ''
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

  return 'Created'
}

const getOrderStatusClass = (order) => {
  const status = getOrderStatus(order)

  if (status === 'Delivered') {
    return 'delivered'
  }

  if (status === 'Cancelled') {
    return 'cancelled'
  }

  return ''
}

const canCancelOrder = (order) => {
  return CANCELLABLE_ORDER_STATUSES.includes(getOrderStatus(order))
}

const cancelOrderStatusOnly = async (orderId) => {
  await updateDoc(doc(db, 'orders', orderId), {
    status: 'Cancelled',
    updatedAt: serverTimestamp()
  })
}

const cancelOrderAndRestoreStock = async (orderId) => {
  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, 'orders', orderId)
    const orderSnapshot = await transaction.get(orderRef)

    if (!orderSnapshot.exists()) {
      throw new Error('Order not found.')
    }

    const latestOrder = orderSnapshot.data()
    const latestStatus = latestOrder?.status || 'Created'
    if (!CANCELLABLE_ORDER_STATUSES.includes(latestStatus)) {
      throw new Error('Order can no longer be cancelled.')
    }

    const items = Array.isArray(latestOrder?.items) ? latestOrder.items : []
    const productReads = []

    for (const item of items) {
      const productRef = doc(db, 'products', String(item.id))
      const productSnapshot = await transaction.get(productRef)
      productReads.push({
        item,
        productRef,
        productSnapshot
      })
    }

    for (const { item, productRef, productSnapshot } of productReads) {
      if (!productSnapshot.exists()) {
        continue
      }

      const currentStock = productSnapshot.data()?.stock
      if (typeof currentStock === 'number') {
        const quantityToRestore = Number(item?.quantity) || 0
        transaction.update(productRef, {
          stock: currentStock + quantityToRestore
        })
      }
    }

    transaction.update(orderRef, {
      status: 'Cancelled',
      updatedAt: serverTimestamp()
    })
  })
}

const handleCancelOrder = async (order) => {
  if (!order || !canCancelOrder(order) || isCancellingOrder.value) {
    return
  }

  cancelErrorMessage.value = ''
  cancelSuccessMessage.value = ''
  isCancellingOrder.value = true

  try {
    try {
      await cancelOrderAndRestoreStock(order.id)
    } catch (error) {
      const errorCode = String(error?.code || '').toLowerCase()
      const message = String(error?.message || '').toLowerCase()
      const isPermissionError = errorCode.includes('permission-denied') || message.includes('permission') || message.includes('insufficient')

      if (!isPermissionError) {
        throw error
      }

      await cancelOrderStatusOnly(order.id)
    }

    const orderEntry = orders.value.find(orderItem => orderItem.id === order.id)
    if (orderEntry) {
      orderEntry.status = 'Cancelled'
    }

    cancelSuccessMessage.value = 'Order cancelled successfully.'
  } catch (error) {
    console.error('Failed to cancel order:', error)
    cancelErrorMessage.value = 'Unable to cancel order. It may no longer be cancellable.'
  } finally {
    isCancellingOrder.value = false
  }
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
          <span class="order-status" :class="getOrderStatusClass(order)">{{ getOrderStatus(order) }}</span>
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
              <span class="order-status" :class="getOrderStatusClass(selectedOrder)">{{ getOrderStatus(selectedOrder) }}</span>
            </div>
          </div>
          <div class="order-total">{{ selectedOrder.total.toFixed(2) }} €</div>
        </div>

        <div class="order-actions">
          <button
            v-if="canCancelOrder(selectedOrder)"
            type="button"
            class="cancel-order-btn"
            :disabled="isCancellingOrder"
            @click="handleCancelOrder(selectedOrder)"
          >
            {{ isCancellingOrder ? 'Cancelling...' : 'Cancel Order' }}
          </button>
          <p v-if="cancelSuccessMessage" class="order-feedback success">{{ cancelSuccessMessage }}</p>
          <p v-if="cancelErrorMessage" class="order-feedback error">{{ cancelErrorMessage }}</p>
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

.order-status.delivered {
  color: #166534;
  background-color: #dcfce7;
  border-color: #86efac;
}

.order-status.cancelled {
  color: #991b1b;
  background-color: #fee2e2;
  border-color: #fca5a5;
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

.order-actions {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.cancel-order-btn {
  border: 1px solid #fca5a5;
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-order-btn:hover:not(:disabled) {
  background-color: #fecaca;
}

.cancel-order-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.order-feedback {
  margin: 0;
  font-size: 13px;
}

.order-feedback.success {
  color: #166534;
}

.order-feedback.error {
  color: #b91c1c;
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