<script setup>
import { useCart } from '@/composables/useCart.js'

const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart()
</script>


<template>
  <main class="main">
    <h1 class="main-title">Shopping Cart</h1>

    <div v-if="cart.length === 0" class="empty-cart">
      <p>Your cart is empty.</p>
      <router-link to="/products" class="shop-link">Continue Shopping</router-link>
    </div>

    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in cart" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" class="cart-item-image" />
          <div class="cart-item-details">
            <h3 class="cart-item-title">{{ item.name }}</h3>
            <p class="cart-item-price">{{ item.price.toFixed(2) }} €</p>
          </div>
          <div class="cart-item-controls">
            <div class="quantity-controls">
              <button @click="updateQuantity(item.id, item.quantity - 1)" class="quantity-btn">-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button @click="updateQuantity(item.id, item.quantity + 1)" class="quantity-btn">+</button>
            </div>
            <p class="item-total">{{ (item.price * item.quantity).toFixed(2) }} €</p>
            <button @click="removeFromCart(item.id)" class="remove-btn">Remove</button>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-row">
          <span>Total Items:</span>
          <span>{{ totalItems }}</span>
        </div>
        <div class="summary-row total">
          <span>Total Price:</span>
          <span>{{ totalPrice.toFixed(2) }} €</span>
        </div>
        <div class="cart-actions">
          <button @click="clearCart" class="clear-cart-btn">Clear Cart</button>
          <router-link to="/checkout" class="checkout-btn">Proceed to Checkout</router-link>
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

.empty-cart {
  text-align: center;
  padding: 48px 0;
}

.empty-cart p {
  font-size: 18px;
  margin-bottom: 16px;
  color: #666;
}

.shop-link {
  display: inline-block;
  padding: 12px 24px;
  background-color: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.shop-link:hover {
  background-color: #1d4ed8;
}

.cart-content {
  display: flex;
  gap: 32px;
}

.cart-items {
  flex: 1;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  background-color: white;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 4px;
}

.cart-item-details {
  flex: 1;
}

.cart-item-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.cart-item-price {
  color: #16a34a;
  font-weight: 500;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background-color 0.2s;
}

.quantity-btn:hover {
  background-color: #f3f4f6;
}

.quantity {
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}

.item-total {
  font-weight: 600;
  color: #16a34a;
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  padding: 8px 16px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #b91c1c;
}

.cart-summary {
  width: 300px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
  height: fit-content;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 16px;
}

.summary-row.total {
  font-size: 20px;
  font-weight: bold;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  margin-top: 16px;
}

.cart-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.clear-cart-btn {
  flex: 1;
  padding: 12px;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.clear-cart-btn:hover {
  background-color: #4b5563;
}

.checkout-btn {
  flex: 1;
  padding: 12px;
  background-color: #16a34a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-block;
  text-align: center;
  text-decoration: none;
}

.checkout-btn:hover {
  background-color: #15803d;
}

@media (max-width: 768px) {
  .cart-content {
    flex-direction: column;
    gap: 16px;
  }

  .cart-summary {
    width: 100%;
  }

  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .cart-item-controls {
    width: 100%;
    flex-wrap: wrap;
    gap: 12px;
  }

  .quantity-controls {
    order: 1;
  }

  .item-total {
    order: 2;
    margin-left: auto;
  }

  .remove-btn {
    order: 3;
    width: 100%;
  }

  .clear-cart-btn,
  .checkout-btn {
    flex: 1;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }

  .cart-item-image {
    width: 60px;
    height: 60px;
  }

  .cart-item-title {
    font-size: 16px;
  }

  .quantity-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .quantity {
    min-width: 24px;
    text-align: center;
  }

  .clear-cart-btn,
  .checkout-btn {
    width: 100%;
    padding: 12px;
  }

  .cart-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>