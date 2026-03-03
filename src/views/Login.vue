<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

const USERS_STORAGE_KEY = 'users'
const CURRENT_USER_KEY = 'currentUser'

const handleLogin = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  isSubmitting.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    const users = savedUsers ? JSON.parse(savedUsers) : []

    const matchedUser = users.find(
      user => user.email.toLowerCase() === email.value.toLowerCase() && user.password === password.value
    )

    if (!matchedUser) {
      errorMessage.value = 'Invalid email or password.'
      return
    }

    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({
        id: matchedUser.id,
        name: `${matchedUser.firstName} ${matchedUser.lastName}`.trim(),
        email: matchedUser.email,
        loggedInAt: new Date().toISOString()
      })
    )

    router.push('/')
  } catch (error) {
    errorMessage.value = 'Unable to log in. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="main">
    <h1 class="main-title">Login</h1>

    <section class="auth-card">
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" required :disabled="isSubmitting" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" required :disabled="isSubmitting" />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p class="redirect-text">
        Don't have an account?
        <router-link to="/register">Register</router-link>
      </p>
    </section>
  </main>
</template>

<style scoped>
.main {
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
}

.main-title {
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 24px;
}

.auth-card {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.error-message {
  color: #dc2626;
  margin: 0;
}

.submit-btn {
  border: none;
  border-radius: 6px;
  background-color: #2563eb;
  color: white;
  font-weight: 600;
  padding: 11px 14px;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.redirect-text {
  margin-top: 16px;
  color: #4b5563;
}

.redirect-text a {
  color: #2563eb;
  text-decoration: none;
}

.redirect-text a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }

  .auth-card {
    padding: 16px;
  }
}
</style>
