import { ref } from 'vue'
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
const authInitialized = ref(false)
let unsubscribeAuthListener = null

const initAuth = () => {
  if (unsubscribeAuthListener) {
    return
  }

  unsubscribeAuthListener = onAuthStateChanged(auth, (user) => {
    currentUser.value = user
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
    await updateDoc(userDocRef, {
      ...payload,
      updatedAt: serverTimestamp()
    })
    return
  }

  await setDoc(userDocRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
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
    authInitialized,
    initAuth,
    waitForAuthInit,
    registerWithEmail,
    loginWithEmail,
    logout,
    getUserProfile,
    saveUserProfile,
    changeUserEmail,
    changeUserPassword
  }
}