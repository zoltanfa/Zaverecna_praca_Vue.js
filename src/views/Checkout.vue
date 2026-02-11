<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart.js'

const router = useRouter()
const { cart, totalPrice, clearCart } = useCart()

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  cardName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: ''
})

const submitted = ref(false)
const isProcessing = ref(false)
const ORDER_STORAGE_KEY = 'orderHistory'

const loadOrders = () => {
  try {
    const savedOrders = localStorage.getItem(ORDER_STORAGE_KEY)
    return savedOrders ? JSON.parse(savedOrders) : []
  } catch (error) {
    console.error('Failed to load order history:', error)
    return []
  }
}

const saveOrders = (orders) => {
  try {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders))
  } catch (error) {
    console.error('Failed to save order history:', error)
  }
}

const saveOrder = () => {
  const orders = loadOrders()
  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    customerName: `${formData.value.firstName} ${formData.value.lastName}`.trim(),
    email: formData.value.email,
    address: `${formData.value.address}, ${formData.value.city}, ${formData.value.postalCode}, ${formData.value.country}`,
    items: cart.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total: totalPrice.value
  }

  orders.unshift(order)
  saveOrders(orders)
}

const handleSubmit = async (event) => {
  const form = event?.target
  if (form && !form.reportValidity()) {
    return
  }

  isProcessing.value = true

  await new Promise(resolve => setTimeout(resolve, 2000))

  saveOrder()
  submitted.value = true
  isProcessing.value = false

  setTimeout(() => {
    clearCart()
    router.push('/')
  }, 2000)
}

const goBack = () => {
  router.push('/cart')
}
</script>


<template>
  <main class="main">
    <h1 class="main-title">Checkout</h1>

    <div v-if="submitted" class="success-message">
      <h2>Order Placed Successfully!</h2>
      <p>Thank you for your purchase. Redirecting to home page...</p>
    </div>

    <div v-else class="checkout-container">
      <form @submit.prevent="handleSubmit" class="checkout-form">
        <section class="form-section">
          <h2>Personal Information</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="lastName">Last Name *</label>
              <input
                id="lastName"
                v-model="formData.lastName"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="phone">Phone Number *</label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                required
                :disabled="isProcessing"
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>Shipping Address</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="address">Street Address *</label>
              <input
                id="address"
                v-model="formData.address"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="city">City *</label>
              <input
                id="city"
                v-model="formData.city"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="postalCode">Postal Code *</label>
              <input
                id="postalCode"
                v-model="formData.postalCode"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="country">Country *</label>
              <input
                id="country"
                v-model="formData.country"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>Payment Information</h2>
          <div class="form-grid">
            <div class="form-group full-width">
              <label for="cardName">Cardholder Name *</label>
              <input
                id="cardName"
                v-model="formData.cardName"
                type="text"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group full-width">
              <label for="cardNumber">Card Number *</label>
              <input
                id="cardNumber"
                v-model="formData.cardNumber"
                type="text"
                maxlength="16"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="expiryDate">Expiry Date (MM/YY) *</label>
              <input
                id="expiryDate"
                v-model="formData.expiryDate"
                type="text"
                maxlength="5"
                required
                :disabled="isProcessing"
              />
            </div>
            <div class="form-group">
              <label for="cvv">CVV *</label>
              <input
                id="cvv"
                v-model="formData.cvv"
                type="text"
                maxlength="3"
                required
                :disabled="isProcessing"
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <h2>Order Summary</h2>
          <div class="order-summary">
            <div v-if="cart.length === 0" class="empty-cart-message">
              <p>Your cart is empty. <router-link to="/products">Continue shopping</router-link></p>
            </div>
            <div v-else>
              <div v-for="item in cart" :key="item.id" class="summary-item">
                <span>{{ item.name }} x {{ item.quantity }}</span>
                <span>{{ (item.price * item.quantity).toFixed(2) }} €</span>
              </div>
              <div class="summary-total">
                <strong>Total:</strong>
                <strong>{{ totalPrice.toFixed(2) }} €</strong>
              </div>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <button type="button" @click="goBack" class="cancel-btn" :disabled="isProcessing">
            Back to Cart
          </button>
          <button type="submit" class="submit-btn" :disabled="isProcessing || cart.length === 0">
            {{ isProcessing ? 'Processing...' : 'Place Order' }}
          </button>
        </div>
      </form>
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

.success-message {
  background-color: #dcfce7;
  border: 2px solid #22c55e;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
}

.success-message h2 {
  color: #22c55e;
  margin-bottom: 8px;
}

.success-message p {
  color: #666;
}

.checkout-container {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 24px;
}

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 24px;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.order-summary {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding: 16px 0;
  font-size: 18px;
  border-top: 2px solid #e5e7eb;
  margin-top: 8px;
}

.empty-cart-message {
  text-align: center;
  padding: 20px;
  color: #666;
}

.empty-cart-message a {
  color: #2563eb;
  text-decoration: none;
}

.empty-cart-message a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

.cancel-btn,
.submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover:not(:disabled) {
  background-color: #d1d5db;
}

.submit-btn {
  background-color: #2563eb;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-btn:active{
    background-color: #afb0b3;
}

.cancel-btn:disabled,
.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .main {
    padding: 12px;
  }

  .main-title {
    font-size: 24px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .submit-btn {
    width: 100%;
  }

  .form-section h2 {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 8px;
  }

  .checkout-container {
    padding: 16px;
  }

  .main-title {
    font-size: 20px;
  }

  .form-section {
    padding-bottom: 16px;
  }

  .form-section h2 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input {
    padding: 8px 10px;
    font-size: 13px;
  }

  .order-summary {
    padding: 12px;
  }

  .summary-item,
  .summary-total {
    font-size: 13px;
    padding: 10px 0;
  }

  .summary-total {
    font-size: 15px;
  }

  .cancel-btn,
  .submit-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
