<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isSubmitting = ref(false)
const errorMessage = ref('')

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const USERS_STORAGE_KEY = 'users'

const handleRegister = async () => {
  errorMessage.value = ''

  const { firstName, lastName, email, password, confirmPassword } = formData.value

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  if (password !== confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    const users = savedUsers ? JSON.parse(savedUsers) : []

    const userExists = users.some(user => user.email.toLowerCase() === email.toLowerCase())
    if (userExists) {
      errorMessage.value = 'This email is already registered.'
      return
    }

    users.push({
      id: Date.now(),
      firstName,
      lastName,
      email,
      password,
      createdAt: new Date().toISOString()
    })

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    router.push('/login')
  } catch (error) {
    errorMessage.value = 'Unable to register. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="main">
    <h1 class="main-title">Register</h1>

    <section class="auth-card">
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input id="firstName" v-model="formData.firstName" type="text" required :disabled="isSubmitting" />
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input id="lastName" v-model="formData.lastName" type="text" required :disabled="isSubmitting" />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="formData.email" type="email" required :disabled="isSubmitting" />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="formData.password" type="password" required :disabled="isSubmitting" />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input id="confirmPassword" v-model="formData.confirmPassword" type="password" required :disabled="isSubmitting" />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <p class="redirect-text">
        Already have an account?
        <router-link to="/login">Login</router-link>
      </p>
    </section>
  </main>
</template>

<style scoped>
.main {
  max-width: 560px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
