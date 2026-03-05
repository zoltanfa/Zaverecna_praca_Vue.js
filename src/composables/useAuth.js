import { computed, ref } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
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

const isAdmin = computed(() => currentUserRole.value === 'admin')

const loadCurrentUserRole = async (user) => {
  if (!user) {
    currentUserRole.value = 'guest'
    return
  }

  const profile = await getUserProfile(user.uid)
  currentUserRole.value = profile?.role || 'customer'
}

const initAuth = () => {
  if (unsubscribeAuthListener) {
    return
  }

  unsubscribeAuthListener = onAuthStateChanged(auth, async (user) => {
    currentUser.value = user
    await loadCurrentUserRole(user)
    authInitialized.value = true
  })
}

const waitForAuthInit = async () => {
  if (authInitialized.value) {
    return
  }

  await new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, () => {
      authInitialized.value = true
      stop()
      resolve()
    })
  })
}

const registerWithEmail = async ({ firstName, lastName, email, password }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) {
    await updateProfile(user, { displayName: fullName })
  }

  await setDoc(doc(db, 'profiles', user.uid), {
    firstName,
    lastName,
    email,
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
  const { user } = await signInWithEmailAndPassword(auth, email, password)
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

  await updateEmail(auth.currentUser, newEmail)
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