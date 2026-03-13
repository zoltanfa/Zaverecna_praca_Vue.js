import { computed, ref } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/firebase.js'

const currentUser = ref(null)
const currentUserRole = ref('guest')
const authInitialized = ref(false)
let unsubscribeAuthListener = null
let authInitPromise = null

const isAdmin = computed(() => currentUserRole.value === 'admin')

const normalizeEmail = (email) => String(email || '').trim().toLowerCase()

const syncProfileEmailWithAuth = async (user) => {
  if (!user) {
    return
  }

  const authEmail = normalizeEmail(user.email)

  if (!authEmail) {
    return
  }

  const profileRef = doc(db, 'profiles', user.uid)
  const snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) {
    return
  }

  const profileEmail = normalizeEmail(snapshot.data()?.email)

  if (profileEmail === authEmail) {
    return
  }

  await updateDoc(profileRef, {
    email: authEmail,
    updatedAt: serverTimestamp()
  })
}

const loadCurrentUserRole = async (user) => {
  if (!user) {
    currentUserRole.value = 'guest'
    return
  }

  const profile = await getUserProfile(user.uid)
  currentUserRole.value = profile?.role || 'customer'
}

const initAuth = () => {
  if (authInitPromise) {
    return authInitPromise
  }

  authInitPromise = new Promise((resolve) => {
    let didResolveInitialState = false

    unsubscribeAuthListener = onAuthStateChanged(auth, async (user) => {
      currentUser.value = user

      try {
        await syncProfileEmailWithAuth(user)
        await loadCurrentUserRole(user)
      } catch (error) {
        console.error('Auth sync failed:', error)
      }

      authInitialized.value = true

      if (!didResolveInitialState) {
        didResolveInitialState = true
        resolve()
      }
    })
  })

  return authInitPromise
}

const waitForAuthInit = async () => {
  if (authInitialized.value) {
    return
  }

  await initAuth()
}

const registerWithEmail = async ({ firstName, lastName, email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  const { user } = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) {
    await updateProfile(user, { displayName: fullName })
  }

  await setDoc(doc(db, 'profiles', user.uid), {
    firstName,
    lastName,
    email: normalizedEmail,
    role: 'customer',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  return user
}

const loginWithEmail = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email)
  const { user } = await signInWithEmailAndPassword(auth, normalizedEmail, password)
  return user
}

const logout = async () => {
  await signOut(auth)
}

const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, 'profiles', uid))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data()
}

const saveUserProfile = async (uid, payload) => {
  const userDocRef = doc(db, 'profiles', uid)
  const existingSnapshot = await getDoc(userDocRef)

  if (existingSnapshot.exists()) {
    const existingRole = existingSnapshot.data()?.role || 'customer'

    await updateDoc(userDocRef, {
      ...payload,
      role: existingRole,
      updatedAt: serverTimestamp()
    })

    if (auth.currentUser && auth.currentUser.uid === uid) {
      currentUserRole.value = existingRole
    }

    return
  }

  await setDoc(userDocRef, {
    ...payload,
    role: 'customer',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })

  if (auth.currentUser && auth.currentUser.uid === uid) {
    currentUserRole.value = 'customer'
  }
}

const refreshCurrentUserRole = async () => {
  await loadCurrentUserRole(auth.currentUser)
}

const changeUserEmail = async (newEmail) => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user.')
  }

  await verifyBeforeUpdateEmail(auth.currentUser, newEmail)
}

const changeUserPassword = async ({ currentPassword, newPassword }) => {
  if (!auth.currentUser || !auth.currentUser.email) {
    throw new Error('No authenticated user.')
  }

  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
  await reauthenticateWithCredential(auth.currentUser, credential)
  await updatePassword(auth.currentUser, newPassword)
}

export function useAuth() {
  return {
    currentUser,
    currentUserRole,
    isAdmin,
    authInitialized,
    initAuth,
    waitForAuthInit,
    registerWithEmail,
    loginWithEmail,
    logout,
    getUserProfile,
    saveUserProfile,
    changeUserEmail,
    changeUserPassword,
    refreshCurrentUserRole
  }
}