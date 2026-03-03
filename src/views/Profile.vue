<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const USERS_STORAGE_KEY = 'users'
const CURRENT_USER_KEY = 'currentUser'

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: ''
})

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: ''
})
const showPasswordSection = ref(false)

const currentUserId = ref(null)

const togglePasswordSection = () => {
  showPasswordSection.value = !showPasswordSection.value

  if (!showPasswordSection.value) {
    passwordData.value.currentPassword = ''
    passwordData.value.newPassword = ''
    passwordData.value.confirmNewPassword = ''
  }
}

const loadProfile = () => {
  const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY)
  if (!savedCurrentUser) {
    router.push('/login')
    return
  }

  const currentUser = JSON.parse(savedCurrentUser)
  currentUserId.value = currentUser.id

  const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
  const users = savedUsers ? JSON.parse(savedUsers) : []
  const fullUser = users.find(user => user.id === currentUser.id || user.email === currentUser.email)

  if (!fullUser) {
    formData.value.firstName = currentUser.name?.split(' ')[0] || ''
    formData.value.lastName = currentUser.name?.split(' ').slice(1).join(' ') || ''
    formData.value.email = currentUser.email || ''
    formData.value.phone = currentUser.phone || ''
    formData.value.address = currentUser.address || ''
    formData.value.city = currentUser.city || ''
    formData.value.postalCode = currentUser.postalCode || ''
    formData.value.country = currentUser.country || ''
    return
  }

  formData.value.firstName = fullUser.firstName || ''
  formData.value.lastName = fullUser.lastName || ''
  formData.value.email = fullUser.email || ''
  formData.value.phone = fullUser.phone || ''
  formData.value.address = fullUser.address || ''
  formData.value.city = fullUser.city || ''
  formData.value.postalCode = fullUser.postalCode || ''
  formData.value.country = fullUser.country || ''
}

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const { firstName, lastName, email, phone, address, city, postalCode, country } = formData.value
  const { currentPassword, newPassword, confirmNewPassword } = passwordData.value
  const wantsPasswordChange = showPasswordSection.value && !!(currentPassword || newPassword || confirmNewPassword)

  if (!firstName || !lastName || !email || !phone || !address || !city || !postalCode || !country) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  if (wantsPasswordChange) {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      errorMessage.value = 'Fill in all password fields to change your password.'
      return
    }

    if (newPassword.length < 6) {
      errorMessage.value = 'Password must have at least 6 characters.'
      return
    }

    if (newPassword !== confirmNewPassword) {
      errorMessage.value = "Passwords don't match."
      return
    }
  }

  isSubmitting.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    const users = savedUsers ? JSON.parse(savedUsers) : []

    const duplicateEmail = users.some(
      user => user.email.toLowerCase() === email.toLowerCase() && user.id !== currentUserId.value
    )

    if (duplicateEmail) {
      errorMessage.value = 'This email is already in use.'
      return
    }

    const userIndex = users.findIndex(user => user.id === currentUserId.value)

    if (wantsPasswordChange) {
      if (userIndex === -1) {
        errorMessage.value = 'Unable to change password for this account.'
        return
      }

      if (users[userIndex].password !== currentPassword) {
        errorMessage.value = 'Current password is incorrect.'
        return
      }
    }

    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        postalCode,
        country,
        ...(wantsPasswordChange ? { password: newPassword } : {})
      }
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
    }

    const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY)
    const currentUser = savedCurrentUser ? JSON.parse(savedCurrentUser) : {}

    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify({
        ...currentUser,
        id: currentUserId.value,
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        address,
        city,
        postalCode,
        country
      })
    )

    if (wantsPasswordChange) {
      passwordData.value.currentPassword = ''
      passwordData.value.newPassword = ''
      passwordData.value.confirmNewPassword = ''
    }

    successMessage.value = 'Profile updated successfully.'
  } catch (error) {
    errorMessage.value = 'Unable to update profile. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <main class="main">
    <h1 class="main-title">My Profile</h1>

    <section class="profile-card">
      <form @submit.prevent="saveProfile" class="profile-form">
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
          <label for="phone">Phone Number</label>
          <input id="phone" v-model="formData.phone" type="tel" required :disabled="isSubmitting" />
        </div>

        <div class="form-group">
          <label for="address">Street Address</label>
          <input id="address" v-model="formData.address" type="text" required :disabled="isSubmitting" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input id="city" v-model="formData.city" type="text" required :disabled="isSubmitting" />
          </div>
          <div class="form-group">
            <label for="postalCode">Postal Code</label>
            <input id="postalCode" v-model="formData.postalCode" type="text" required :disabled="isSubmitting" />
          </div>
        </div>

        <div class="form-group">
          <label for="country">Country</label>
          <input id="country" v-model="formData.country" type="text" required :disabled="isSubmitting" />
        </div>

        <button type="button" class="toggle-password-btn" :disabled="isSubmitting" @click="togglePasswordSection">
          {{ showPasswordSection ? 'Cancel Password Change' : 'Change Password' }}
        </button>

        <template v-if="showPasswordSection">
          <h2 class="section-title">Change Password</h2>

          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input id="currentPassword" v-model="passwordData.currentPassword" type="password" :disabled="isSubmitting" />
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input id="newPassword" v-model="passwordData.newPassword" type="password" :disabled="isSubmitting" />
          </div>

          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <input id="confirmNewPassword" v-model="passwordData.confirmNewPassword" type="password" :disabled="isSubmitting" />
          </div>
        </template>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
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

.profile-card {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.profile-form {
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

.section-title {
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.toggle-password-btn {
  border: 1px solid #2563eb;
  border-radius: 6px;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  padding: 11px 14px;
  cursor: pointer;
  text-align: center;
  align-self: flex-start;
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}

.toggle-password-btn:hover:not(:disabled) {
  background-color: #dbeafe;
  border-color: #1d4ed8;
}

.toggle-password-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  margin: 0;
}

.success-message {
  color: #15803d;
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

@media (max-width: 480px) {
  .main-title {
    font-size: 24px;
  }

  .profile-card {
    padding: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .toggle-password-btn {
    width: 100%;
  }
}
</style>