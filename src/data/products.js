import { reactive } from 'vue'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '@/firebase.js'

// Firestore is the primary source of product data.
// Keep fallback empty to avoid bundling a huge static catalog in every build chunk.
export const fallbackProducts = []

export const products = reactive([...fallbackProducts])

const normalizeProductId = (rawId) => {
  const numericId = Number(rawId)
  return Number.isNaN(numericId) ? rawId : numericId
}

const mapProductFromDoc = (docSnapshot) => {
  const data = docSnapshot.data()
  const rawId = data.id ?? docSnapshot.id

  return {
    ...data,
    id: normalizeProductId(rawId)
  }
}

let loadProductsPromise = null

export const loadProductsFromDatabase = async (forceRefresh = false) => {
  if (forceRefresh) {
    loadProductsPromise = null
  }

  if (loadProductsPromise) {
    return loadProductsPromise
  }

  loadProductsPromise = (async () => {
    try {
      const productsQuery = query(
        collection(db, 'products'),
        orderBy('id', 'asc')
      )

      const snapshot = await getDocs(productsQuery)

      if (snapshot.empty) {
        products.splice(0, products.length, ...fallbackProducts)
        return
      }

      const databaseProducts = snapshot.docs.map(mapProductFromDoc)
      products.splice(0, products.length, ...databaseProducts)
    } catch (error) {
      console.error('Failed to load products from Firestore:', error)
      if (products.length === 0) {
        products.splice(0, products.length, ...fallbackProducts)
      }
    }
  })()

  return loadProductsPromise
}
