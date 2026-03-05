<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/composables/useAuth.js'
import { products, loadProductsFromDatabase } from '@/data/products.js'

const { currentUser, currentUserRole, refreshCurrentUserRole } = useAuth()
const roleLabel = computed(() => currentUserRole.value || 'unknown')
const ORDER_STATUS_OPTIONS = ['Created', 'Processed', 'Shipped', 'Delivered', 'Cancelled']
const USER_ROLE_OPTIONS = ['customer', 'admin']

const categories = ref([])
const newCategoryName = ref('')
const editingCategoryId = ref('')
const editingCategoryName = ref('')
const orders = ref([])
const users = ref([])
const selectedUserOrdersUid = ref('')

const isSavingProduct = ref(false)
const isSavingCategory = ref(false)
const isSavingOrder = ref(false)
const isSavingUser = ref(false)
const adminError = ref('')
const adminSuccess = ref('')
const showCategoryManagement = ref(false)
const showProductManagement = ref(false)
const showUserManagement = ref(false)

const productForm = ref({
  id: null,
  name: '',
  price: 0,
  stock: 0,
  category: '',
  subcategory: '',
  brand: '',
  model: '',
  socket: '',
  size: null,
  format: '',
  wattage: null,
  formFactorsText: '',
  image: '',
  description: ''
})

const editingProductId = ref(null)

const displayedProductId = computed(() => editingProductId.value || getNextProductId())
const selectedUserOrders = computed(() => {
  if (!selectedUserOrdersUid.value) {
    return []
  }

  return orders.value.filter(order => order.userId === selectedUserOrdersUid.value)
})

const selectedUserEntry = computed(() => {
  if (!selectedUserOrdersUid.value) {
    return null
  }

  return users.value.find(user => user.uid === selectedUserOrdersUid.value) || null
})

const toCategoryId = (name) => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const resetMessages = () => {
  adminError.value = ''
  adminSuccess.value = ''
}

const resetProductForm = () => {
  editingProductId.value = null
  productForm.value = {
    id: null,
    name: '',
    price: 0,
    stock: 0,
    category: categories.value[0]?.name || '',
    subcategory: '',
    brand: '',
    model: '',
    socket: '',
    size: null,
    format: '',
    wattage: null,
    formFactorsText: '',
    image: '',
    description: ''
  }
}

const loadCategories = async () => {
  const snapshot = await getDocs(collection(db, 'categories'))
  const fromCollection = snapshot.docs.map((categoryDoc) => ({
    id: categoryDoc.id,
    ...categoryDoc.data()
  }))

  if (fromCollection.length > 0) {
    categories.value = fromCollection.sort((a, b) => a.name.localeCompare(b.name))
    return
  }

  const inferredCategories = [...new Set(products.map(product => product.category).filter(Boolean))]
  categories.value = inferredCategories.map((name) => ({ id: toCategoryId(name), name }))
}

const loadOrders = async () => {
  const snapshot = await getDocs(collection(db, 'orders'))

  const mappedOrders = snapshot.docs.map((orderDoc) => {
    const data = orderDoc.data()
    const createdAtDate = data.createdAt?.toDate?.()

    return {
      id: orderDoc.id,
      ...data,
      createdAtMs: createdAtDate ? createdAtDate.getTime() : 0
    }
  })

  orders.value = mappedOrders.sort((a, b) => b.createdAtMs - a.createdAtMs)
}

const loadUsers = async () => {
  const snapshot = await getDocs(collection(db, 'profiles'))

  users.value = snapshot.docs
    .map((userDoc) => ({
      uid: userDoc.id,
      ...userDoc.data()
    }))
    .sort((a, b) => String(a.email || '').localeCompare(String(b.email || '')))
}

const refreshAdminData = async () => {
  await loadProductsFromDatabase(true)
  await loadCategories()
  await loadOrders()
  await loadUsers()
}

const formatOrderDate = (value) => {
  const parsedDate = value?.toDate?.() || (value ? new Date(value) : null)
  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return 'Unknown date'
  }

  const day = String(parsedDate.getDate()).padStart(2, '0')
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const year = parsedDate.getFullYear()
  const hours = String(parsedDate.getHours()).padStart(2, '0')
  const minutes = String(parsedDate.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const updateOrderStatus = async (orderId, nextStatus) => {
  resetMessages()
  isSavingOrder.value = true

  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: nextStatus,
      updatedAt: serverTimestamp()
    })

    const orderEntry = orders.value.find(order => order.id === orderId)
    if (orderEntry) {
      orderEntry.status = nextStatus
    }

    adminSuccess.value = 'Order status updated.'
  } catch (error) {
    console.error('Failed to update order status:', error)
    adminError.value = 'Unable to update order status.'
  } finally {
    isSavingOrder.value = false
  }
}

const updateUserRoleById = async (uid, nextRole) => {
  resetMessages()
  isSavingUser.value = true

  try {
    await updateDoc(doc(db, 'profiles', uid), {
      role: nextRole,
      updatedAt: serverTimestamp()
    })

    const userEntry = users.value.find(user => user.uid === uid)
    if (userEntry) {
      userEntry.role = nextRole
    }

    if (currentUser.value?.uid === uid) {
      await refreshCurrentUserRole()
    }

    adminSuccess.value = 'User role updated.'
  } catch (error) {
    console.error('Failed to update user role:', error)
    adminError.value = 'Unable to update user role.'
  } finally {
    isSavingUser.value = false
  }
}

const getUserOrderCount = (uid) => {
  return orders.value.filter(order => order.userId === uid).length
}

const toggleUserOrders = (uid) => {
  selectedUserOrdersUid.value = selectedUserOrdersUid.value === uid ? '' : uid
}

const ensureCategoryExists = async (name) => {
  const categoryId = toCategoryId(name)
  if (!categoryId) {
    return
  }

  await setDoc(doc(db, 'categories', categoryId), {
    name,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true })
}

const addCategory = async () => {
  resetMessages()
  const categoryName = newCategoryName.value.trim()

  if (!categoryName) {
    adminError.value = 'Category name is required.'
    return
  }

  isSavingCategory.value = true

  try {
    await ensureCategoryExists(categoryName)
    newCategoryName.value = ''
    await loadCategories()
    adminSuccess.value = 'Category created.'
  } catch (error) {
    console.error('Failed to add category:', error)
    adminError.value = 'Unable to create category.'
  } finally {
    isSavingCategory.value = false
  }
}

const startEditCategory = (category) => {
  editingCategoryId.value = category.id
  editingCategoryName.value = category.name
}

const cancelEditCategory = () => {
  editingCategoryId.value = ''
  editingCategoryName.value = ''
}

const saveEditedCategory = async () => {
  resetMessages()
  const newName = editingCategoryName.value.trim()

  if (!editingCategoryId.value || !newName) {
    adminError.value = 'Category name is required.'
    return
  }

  const existingCategory = categories.value.find(category => category.id === editingCategoryId.value)
  if (!existingCategory) {
    adminError.value = 'Category no longer exists.'
    return
  }

  isSavingCategory.value = true

  try {
    const oldName = existingCategory.name
    const newCategoryId = toCategoryId(newName)

    await setDoc(doc(db, 'categories', newCategoryId), {
      name: newName,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true })

    if (newCategoryId !== editingCategoryId.value) {
      await deleteDoc(doc(db, 'categories', editingCategoryId.value))
    }

    if (oldName !== newName) {
      const productsQuery = query(collection(db, 'products'), where('category', '==', oldName))
      const productsSnapshot = await getDocs(productsQuery)
      const batch = writeBatch(db)

      productsSnapshot.docs.forEach((productDoc) => {
        batch.update(productDoc.ref, {
          category: newName
        })
      })

      if (!productsSnapshot.empty) {
        await batch.commit()
      }
    }

    cancelEditCategory()
    await refreshAdminData()
    adminSuccess.value = 'Category updated.'
  } catch (error) {
    console.error('Failed to update category:', error)
    adminError.value = 'Unable to update category.'
  } finally {
    isSavingCategory.value = false
  }
}

const deleteCategory = async (category) => {
  resetMessages()
  isSavingCategory.value = true

  try {
    const hasProducts = products.some(product => product.category === category.name)
    if (hasProducts) {
      adminError.value = 'Cannot delete category that is used by products.'
      return
    }

    await deleteDoc(doc(db, 'categories', category.id))
    await loadCategories()
    adminSuccess.value = 'Category deleted.'
  } catch (error) {
    console.error('Failed to delete category:', error)
    adminError.value = 'Unable to delete category.'
  } finally {
    isSavingCategory.value = false
  }
}

const startEditProduct = (product) => {
  editingProductId.value = product.id
  productForm.value = {
    id: product.id,
    name: product.name || '',
    price: product.price || 0,
    stock: typeof product.stock === 'number' ? product.stock : 0,
    category: product.category || '',
    subcategory: product.subcategory || '',
    brand: product.brand || '',
    model: product.model || '',
    socket: product.socket || '',
    size: typeof product.size === 'number' ? product.size : null,
    format: product.format || '',
    wattage: typeof product.wattage === 'number' ? product.wattage : null,
    formFactorsText: Array.isArray(product.formFactors) ? product.formFactors.join(', ') : '',
    image: product.image || '',
    description: product.description || ''
  }
}

const getNextProductId = () => {
  if (products.length === 0) {
    return 1
  }

  return Math.max(...products.map(product => Number(product.id) || 0)) + 1
}

const saveProduct = async () => {
  resetMessages()
  const category = productForm.value.category.trim()

  if (!productForm.value.name.trim() || !category || !productForm.value.image.trim()) {
    adminError.value = 'Name, category, and image are required.'
    return
  }

  if (Number(productForm.value.price) < 0 || Number(productForm.value.stock) < 0) {
    adminError.value = 'Price and stock cannot be negative.'
    return
  }

  isSavingProduct.value = true

  try {
    const id = editingProductId.value || getNextProductId()

    const payload = {
      id,
      name: productForm.value.name.trim(),
      price: Number(productForm.value.price),
      stock: Number(productForm.value.stock),
      category,
      subcategory: productForm.value.subcategory.trim(),
      brand: productForm.value.brand.trim(),
      model: productForm.value.model.trim(),
      socket: productForm.value.socket.trim(),
      image: productForm.value.image.trim(),
      description: productForm.value.description.trim(),
      updatedAt: serverTimestamp()
    }

    if (productForm.value.size !== null && productForm.value.size !== '') {
      payload.size = Number(productForm.value.size)
    }

    if (productForm.value.wattage !== null && productForm.value.wattage !== '') {
      payload.wattage = Number(productForm.value.wattage)
    }

    if (productForm.value.format.trim()) {
      payload.format = productForm.value.format.trim()
    }

    const formFactors = productForm.value.formFactorsText
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)

    if (formFactors.length > 0) {
      payload.formFactors = formFactors
    }

    const productRef = doc(db, 'products', String(id))
    await setDoc(productRef, {
      ...payload,
      createdAt: serverTimestamp()
    }, { merge: true })

    await ensureCategoryExists(category)
    await refreshAdminData()
    resetProductForm()
    adminSuccess.value = 'Product saved.'
  } catch (error) {
    console.error('Failed to save product:', error)
    adminError.value = 'Unable to save product.'
  } finally {
    isSavingProduct.value = false
  }
}

const deleteProduct = async (productId) => {
  resetMessages()
  isSavingProduct.value = true

  try {
    await deleteDoc(doc(db, 'products', String(productId)))
    await refreshAdminData()
    adminSuccess.value = 'Product deleted.'
  } catch (error) {
    console.error('Failed to delete product:', error)
    adminError.value = 'Unable to delete product.'
  } finally {
    isSavingProduct.value = false
  }
}

onMounted(async () => {
  await refreshAdminData()
  resetProductForm()
})
</script>

<template>
  <main class="main">
    <h1 class="main-title">Admin Panel</h1>
    <p class="main-description">Role: <strong>{{ roleLabel }}</strong></p>

    <p v-if="adminSuccess" class="status success">{{ adminSuccess }}</p>
    <p v-if="adminError" class="status error">{{ adminError }}</p>

    <section class="panel">
      <h2>Management Sections</h2>
      <div class="row">
        <button
          type="button"
          class="btn"
          :class="{ muted: !showCategoryManagement }"
          @click="showCategoryManagement = !showCategoryManagement"
        >
          {{ showCategoryManagement ? 'Hide Category Management' : 'Show Category Management' }}
        </button>
        <button
          type="button"
          class="btn"
          :class="{ muted: !showProductManagement }"
          @click="showProductManagement = !showProductManagement"
        >
          {{ showProductManagement ? 'Hide Product Management' : 'Show Product Management' }}
        </button>
        <button
          type="button"
          class="btn"
          :class="{ muted: !showUserManagement }"
          @click="showUserManagement = !showUserManagement"
        >
          {{ showUserManagement ? 'Hide User Management' : 'Show User Management' }}
        </button>
      </div>
    </section>

    <section v-if="showCategoryManagement" class="panel">
      <h2>Categories</h2>
      <div class="row">
        <input v-model="newCategoryName" type="text" class="input" placeholder="New category name" />
        <button type="button" class="btn" :disabled="isSavingCategory" @click="addCategory">Add Category</button>
      </div>

      <div class="list">
        <div v-for="category in categories" :key="category.id" class="list-item">
          <template v-if="editingCategoryId === category.id">
            <input v-model="editingCategoryName" type="text" class="input" />
            <button type="button" class="btn" :disabled="isSavingCategory" @click="saveEditedCategory">Save</button>
            <button type="button" class="btn muted" @click="cancelEditCategory">Cancel</button>
          </template>
          <template v-else>
            <span>{{ category.name }}</span>
            <div class="actions">
              <button type="button" class="btn muted" @click="startEditCategory(category)">Edit</button>
              <button type="button" class="btn danger" :disabled="isSavingCategory" @click="deleteCategory(category)">Delete</button>
            </div>
          </template>
        </div>
      </div>
    </section>

    <section v-if="showProductManagement" class="panel">
      <h2>{{ editingProductId ? `Edit Product #${editingProductId}` : 'Create Product' }}</h2>
      <div class="grid">
        <input :value="displayedProductId" type="text" class="input" placeholder="Product ID" readonly />
        <input v-model="productForm.name" type="text" class="input" placeholder="Name" />
        <input v-model.number="productForm.price" type="number" min="0" step="0.01" class="input" placeholder="Price" />
        <input v-model.number="productForm.stock" type="number" min="0" step="1" class="input" placeholder="Stock" />
        <select v-model="productForm.category" class="input">
          <option value="" disabled>Select category</option>
          <option v-for="category in categories" :key="category.id" :value="category.name">{{ category.name }}</option>
        </select>
        <input v-model="productForm.subcategory" type="text" class="input" placeholder="Subcategory" />
        <input v-model="productForm.brand" type="text" class="input" placeholder="Brand" />
        <input v-model="productForm.model" type="text" class="input" placeholder="Model" />
        <input v-model="productForm.socket" type="text" class="input" placeholder="Socket" />
        <input v-model.number="productForm.size" type="number" min="0" class="input" placeholder="Size" />
        <input v-model="productForm.format" type="text" class="input" placeholder="Format" />
        <input v-model.number="productForm.wattage" type="number" min="0" class="input" placeholder="Wattage" />
        <input v-model="productForm.formFactorsText" type="text" class="input" placeholder="Form factors (comma separated)" />
        <input v-model="productForm.image" type="text" class="input wide" placeholder="Image URL" />
        <textarea v-model="productForm.description" class="input wide" rows="4" placeholder="Description"></textarea>
      </div>

      <div class="row">
        <button type="button" class="btn" :disabled="isSavingProduct" @click="saveProduct">Save Product</button>
        <button type="button" class="btn muted" @click="resetProductForm">Reset</button>
      </div>
    </section>

    <section v-if="showProductManagement" class="panel">
      <h2>Products</h2>
      <div class="list">
        <div v-for="product in products" :key="product.id" class="list-item">
          <div>
            <strong>#{{ product.id }}</strong> {{ product.name }}
            <small class="meta">{{ product.category }} | {{ Number(product.price).toFixed(2) }} EUR | stock: {{ typeof product.stock === 'number' ? product.stock : 'N/A' }}</small>
          </div>
          <div class="actions">
            <button type="button" class="btn muted" @click="startEditProduct(product)">Edit</button>
            <button type="button" class="btn danger" :disabled="isSavingProduct" @click="deleteProduct(product.id)">Delete</button>
          </div>
        </div>
      </div>
    </section>

    <section v-if="showUserManagement" class="panel">
      <h2>Users</h2>
      <div class="list">
        <div v-for="user in users" :key="user.uid" class="list-item">
          <div>
            <strong>{{ user.firstName }} {{ user.lastName }}</strong>
            <small class="meta">{{ user.email || user.uid }} | orders: {{ getUserOrderCount(user.uid) }}</small>
          </div>
          <div class="actions wrap-actions">
            <select
              :value="user.role || 'customer'"
              class="input compact"
              :disabled="isSavingUser"
              @change="updateUserRoleById(user.uid, $event.target.value)"
            >
              <option v-for="role in USER_ROLE_OPTIONS" :key="role" :value="role">{{ role }}</option>
            </select>
            <button type="button" class="btn muted" @click="toggleUserOrders(user.uid)">
              {{ selectedUserOrdersUid === user.uid ? 'Hide Orders' : 'View Orders' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="selectedUserEntry" class="sub-panel">
        <h3>Orders For {{ selectedUserEntry.email || selectedUserEntry.uid }}</h3>
        <div v-if="selectedUserOrders.length === 0" class="empty-note">No orders for this account.</div>
        <div v-else class="list">
          <div v-for="order in selectedUserOrders" :key="order.id" class="list-item">
            <div>
              <strong>#{{ order.id }}</strong>
              <small class="meta">
                {{ Number(order.total || 0).toFixed(2) }} EUR
                | {{ formatOrderDate(order.createdAt) }}
                | {{ order.status || 'Created' }}
              </small>
            </div>
            <div class="actions wrap-actions">
              <select
                :value="order.status || 'Created'"
                class="input compact"
                :disabled="isSavingOrder"
                @change="updateOrderStatus(order.id, $event.target.value)"
              >
                <option v-for="status in ORDER_STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.main-title {
  font-size: 30px;
  font-weight: 700;
  margin: 0 0 8px;
}

.main-description {
  margin: 0 0 16px;
  color: #374151;
}

.status {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.status.success {
  background: #dcfce7;
  color: #166534;
}

.status.error {
  background: #fee2e2;
  color: #991b1b;
}

.panel {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 16px;
}

.panel h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

.row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.input {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
}

.input.wide {
  grid-column: 1 / -1;
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 9px 12px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.btn.muted {
  background: #6b7280;
}

.btn.danger {
  background: #dc2626;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.actions {
  display: flex;
  gap: 6px;
}

.wrap-actions {
  flex-wrap: wrap;
}

.input.compact {
  min-width: 150px;
  padding: 8px 10px;
}

.meta {
  display: block;
  color: #6b7280;
  margin-top: 2px;
}

.sub-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.sub-panel h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.empty-note {
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .list-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
  }
}
</style>