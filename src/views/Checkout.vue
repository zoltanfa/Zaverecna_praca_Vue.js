<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '@/composables/useCart.js'

const router = useRouter()
const { cart, totalPrice, clearCart } = useCart()

const pickupPoints = [
  'Z-BOX Bratislava Central',
  'Packeta Košice - Hlavná 12',
  'Parcel Locker Žilina - Aupark',
  'Packeta Nitra - Mlyny'
]

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  deliveryMethod: 'home',
  pickupPoint: '',
  paymentMethod: 'card',
  cardName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: ''
})

const submitted = ref(false)
const isProcessing = ref(false)
const checkoutForm = ref(null)
const currentStep = ref(1)
const ORDER_STORAGE_KEY = 'orderHistory'

const getDeliveryLabel = () => (formData.value.deliveryMethod === 'home'
  ? 'Home Delivery'
  : formData.value.deliveryMethod === 'pickup'
    ? 'Pickup at Store'
    : 'Pickup Point')

const getPaymentLabel = () => (formData.value.paymentMethod === 'card'
  ? 'Card'
  : formData.value.paymentMethod === 'cash'
    ? (formData.value.deliveryMethod === 'pickup' ? 'Cash at Pickup' : 'Cash on Delivery')
    : formData.value.paymentMethod === 'bankTransfer'
      ? 'Bank Transfer'
      : 'Google Pay')

watch(
  () => formData.value.deliveryMethod,
  (deliveryMethod) => {
    if (deliveryMethod === 'pickupPoint' && formData.value.paymentMethod === 'cash') {
      formData.value.paymentMethod = 'card'
    }

    if (deliveryMethod !== 'pickupPoint') {
      formData.value.pickupPoint = ''
    }
  }
)

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
  const deliveryLabel = getDeliveryLabel()
  const paymentLabel = getPaymentLabel()

  const order = {
    id: Date.now(),
    date: new Date().toISOString(),
    status: 'Created',
    customerName: `${formData.value.firstName} ${formData.value.lastName}`.trim(),
    email: formData.value.email,
    address: `${formData.value.address}, ${formData.value.city}, ${formData.value.postalCode}, ${formData.value.country}`,
    deliveryMethod: formData.value.deliveryMethod,
    deliveryLabel,
    pickupPoint: formData.value.deliveryMethod === 'pickupPoint' ? formData.value.pickupPoint : null,
    paymentMethod: formData.value.paymentMethod,
    paymentLabel,
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

const handleSubmit = async () => {
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

const nextStep = () => {
  if (checkoutForm.value && !checkoutForm.value.reportValidity()) {
    return
  }

  if (currentStep.value < 4) {
    currentStep.value += 1
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1
  }
}

const editOrder = () => {
  currentStep.value = 3
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
      <div class="step-indicator" aria-label="Checkout steps">
        <div class="step-item" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
          <span class="step-number">1</span>
          <span class="step-text">Details</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 1 }"></div>
        <div class="step-item" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
          <span class="step-number">2</span>
          <span class="step-text">Delivery</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 2 }"></div>
        <div class="step-item" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
          <span class="step-number">3</span>
          <span class="step-text">Payment</span>
        </div>
        <div class="step-line" :class="{ active: currentStep > 3 }"></div>
        <div class="step-item" :class="{ active: currentStep === 4 }">
          <span class="step-number">4</span>
          <span class="step-text">Recap</span>
        </div>
      </div>

      <form ref="checkoutForm" @submit.prevent="handleSubmit" class="checkout-form">
        <template v-if="currentStep === 1">
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

          <div class="form-actions">
            <button type="button" @click="goBack" class="cancel-btn" :disabled="isProcessing">
              Back to Cart
            </button>
            <button type="button" @click="nextStep" class="submit-btn" :disabled="cart.length === 0">
              Continue to Delivery
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 2">
          <section class="form-section">
            <h2>Delivery Method</h2>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  id="homeDelivery"
                  v-model="formData.deliveryMethod"
                  type="radio"
                  value="home"
                  :disabled="isProcessing"
                />
                <label for="homeDelivery">Home Delivery</label>
              </div>
              <div class="radio-option">
                <input
                  id="pickup"
                  v-model="formData.deliveryMethod"
                  type="radio"
                  value="pickup"
                  :disabled="isProcessing"
                />
                <label for="pickup">Pickup at Store</label>
              </div>
              <div class="radio-option">
                <input
                  id="pickupPoint"
                  v-model="formData.deliveryMethod"
                  type="radio"
                  value="pickupPoint"
                  :disabled="isProcessing"
                />
                <label for="pickupPoint">Pickup Point</label>
              </div>
            </div>
            <div v-if="formData.deliveryMethod === 'pickupPoint'" class="pickup-point-field">
              <label for="pickupPointName">Pickup Point *</label>
              <select
                id="pickupPointName"
                v-model="formData.pickupPoint"
                :required="formData.deliveryMethod === 'pickupPoint'"
                :disabled="isProcessing"
              >
                <option value="" disabled>Select pickup point</option>
                <option v-for="point in pickupPoints" :key="point" :value="point">
                  {{ point }}
                </option>
              </select>
            </div>
          </section>

          <div class="form-actions">
            <button type="button" @click="previousStep" class="cancel-btn" :disabled="isProcessing">
              Back
            </button>
            <button type="button" @click="nextStep" class="submit-btn" :disabled="cart.length === 0">
              Continue to Payment
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 3">
          <section class="form-section">
            <h2>Payment Method</h2>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  id="cardPayment"
                  v-model="formData.paymentMethod"
                  type="radio"
                  value="card"
                  :disabled="isProcessing"
                />
                <label for="cardPayment">Card</label>
              </div>
              <div v-if="formData.deliveryMethod !== 'pickupPoint'" class="radio-option">
                <input
                  id="cashPayment"
                  v-model="formData.paymentMethod"
                  type="radio"
                  value="cash"
                  :disabled="isProcessing"
                />
                <label for="cashPayment">
                  {{ formData.deliveryMethod === 'pickup' ? 'Cash at Pickup' : 'Cash on Delivery' }}
                </label>
              </div>
              <div class="radio-option">
                <input
                  id="googlePayPayment"
                  v-model="formData.paymentMethod"
                  type="radio"
                  value="googlePay"
                  :disabled="isProcessing"
                />
                <label for="googlePayPayment">Google Pay</label>
              </div>
              <div class="radio-option">
                <input
                  id="bankTransferPayment"
                  v-model="formData.paymentMethod"
                  type="radio"
                  value="bankTransfer"
                  :disabled="isProcessing"
                />
                <label for="bankTransferPayment">Bank Transfer</label>
              </div>
            </div>
          </section>

          <section v-if="formData.paymentMethod === 'googlePay'" class="form-section">
            <h2>Google Pay</h2>
            <div class="payment-note">
              <p>You can complete this payment securely with Google Pay after placing the order.</p>
            </div>
          </section>

          <section v-if="formData.paymentMethod === 'bankTransfer'" class="form-section">
            <h2>Bank Transfer Details</h2>
            <div class="payment-note">
              <p>After placing your order, transfer the total amount to:</p>
              <p><strong>Recipient:</strong> PC Shop s.r.o.</p>
              <p><strong>Bank:</strong> Tatra banka</p>
              <p><strong>IBAN:</strong> SK12 1100 0000 0029 4874 0012</p>
              <p><strong>Amount:</strong> {{ totalPrice.toFixed(2) }} €</p>
              <p><strong>Variable symbol / Reference:</strong> Your order ID (shown after confirmation)</p>
              <p><strong>Payment deadline:</strong> within 3 days from placing the order</p>
              <p><strong>Processing:</strong> Your order will be processed after payment is received.</p>
            </div>
          </section>

          <section v-if="formData.paymentMethod === 'card'" class="form-section">
            <h2>Payment Information</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="cardName">Cardholder Name *</label>
                <input
                  id="cardName"
                  v-model="formData.cardName"
                  type="text"
                  :required="formData.paymentMethod === 'card'"
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
                  :required="formData.paymentMethod === 'card'"
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
                  :required="formData.paymentMethod === 'card'"
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
                  :required="formData.paymentMethod === 'card'"
                  :disabled="isProcessing"
                />
              </div>
            </div>
          </section>

          <div class="form-actions">
            <button type="button" @click="previousStep" class="cancel-btn" :disabled="isProcessing">
              Back
            </button>
            <button type="button" @click="nextStep" class="submit-btn" :disabled="cart.length === 0">
              Review Order
            </button>
          </div>
        </template>

        <template v-else>
          <section class="form-section">
            <h2>Order Recap</h2>
            <div class="order-summary">
              <div class="summary-info recap-grid">
                <div class="recap-card">
                  <h3>Personal Information</h3>
                  <p>{{ formData.firstName }} {{ formData.lastName }}</p>
                  <p>{{ formData.email }}</p>
                  <p>{{ formData.phone }}</p>
                </div>

                <div class="recap-card">
                  <h3>Shipping Address</h3>
                  <p>{{ formData.address }}</p>
                  <p>{{ formData.city }}, {{ formData.postalCode }}</p>
                  <p>{{ formData.country }}</p>
                </div>

                <div class="recap-card">
                  <h3>Delivery & Payment</h3>
                  <p><strong>Delivery:</strong> {{ getDeliveryLabel() }}</p>
                  <p v-if="formData.deliveryMethod === 'pickupPoint'"><strong>Pickup point:</strong> {{ formData.pickupPoint }}</p>
                  <p><strong>Payment:</strong> {{ getPaymentLabel() }}</p>
                </div>
              </div>

              <div class="recap-items">
                <h3>Items</h3>
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
            <button type="button" @click="editOrder" class="cancel-btn" :disabled="isProcessing">
              Back
            </button>
            <button type="submit" class="submit-btn" :disabled="isProcessing || cart.length === 0">
              {{ isProcessing ? 'Processing...' : 'Confirm & Place Order' }}
            </button>
          </div>
        </template>
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

.step-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.step-number {
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  border: 2px solid #d1d5db;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  background-color: white;
}

.step-text {
  font-size: 14px;
  font-weight: 600;
}

.step-item.active {
  color: #1f2937;
}

.step-item.completed {
  color: #1f2937;
}

.step-item.active .step-number {
  border-color: #2563eb;
  background-color: #2563eb;
  color: white;
}

.step-item.completed .step-number {
  border-color: #2563eb;
  background-color: #2563eb;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background-color: #d1d5db;
  margin: 0 12px;
}

.step-line.active {
  background-color: #2563eb;
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

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-option input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
  flex-shrink: 0;
}

.radio-option label {
  margin: 0;
  cursor: pointer;
  font-weight: 400;
  color: #374151;
}

.radio-option input[type="radio"]:disabled {
  cursor: not-allowed;
}

.pickup-point-field {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
}

.pickup-point-field label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
}

.pickup-point-field input,
.pickup-point-field select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: white;
}

.pickup-point-field input:focus,
.pickup-point-field select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.pickup-point-field input:disabled,
.pickup-point-field select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.payment-note {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  color: #374151;
}

.payment-note p {
  margin: 0 0 8px;
}

.payment-note p:last-child {
  margin-bottom: 0;
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

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.recap-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.recap-card {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.recap-card h3,
.recap-items h3 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #1f2937;
}

.recap-card p {
  margin: 0 0 6px;
  color: #374151;
}

.recap-card p:last-child {
  margin-bottom: 0;
}

.recap-items {
  margin-top: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
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
    font-size: 30px;
  }

  .step-text {
    font-size: 13px;
  }

  .checkout-form {
    gap: 24px;
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

  .recap-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 8px;
  }

  .checkout-container {
    padding: 12px;
  }

  .main-title {
    font-size: 24px;
  }

  .step-indicator {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }

  .step-line {
    display: none;
  }

  .step-item {
    justify-content: center;
    padding: 8px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background-color: white;
  }

  .step-item.active,
  .step-item.completed {
    border-color: #2563eb;
  }

  .step-number {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .step-text {
    font-size: 12px;
  }

  .checkout-form {
    gap: 20px;
  }

  .form-section {
    padding-bottom: 16px;
  }

  .form-section h2 {
    font-size: 14px;
    margin-bottom: 12px;
  }

  .radio-option {
    gap: 8px;
    min-height: 36px;
  }

  .radio-option input[type="radio"] {
    width: 20px;
    height: 20px;
  }

  .radio-option label {
    font-size: 14px;
  }

  .pickup-point-field label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .pickup-point-field input,
  .pickup-point-field select {
    padding: 10px 12px;
    font-size: 16px;
  }

  .form-group label {
    font-size: 13px;
    margin-bottom: 6px;
  }

  .form-group input {
    padding: 10px 12px;
    font-size: 16px;
  }

  .payment-note p {
    font-size: 14px;
    line-height: 1.4;
  }

  .order-summary {
    padding: 12px;
  }

  .info-row {
    flex-wrap: wrap;
    font-size: 13px;
  }

  .summary-item,
  .summary-total {
    font-size: 13px;
    padding: 10px 0;
  }

  .summary-item {
    gap: 8px;
  }

  .summary-item span:last-child {
    white-space: nowrap;
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