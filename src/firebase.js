import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBpwCXszj969xjV_WNz6ualo_g8NQ-uOy4',
  authDomain: 'datosdelpaciente-8e3ba.firebaseapp.com',
  projectId: 'datosdelpaciente-8e3ba',
  storageBucket: 'datosdelpaciente-8e3ba.firebasestorage.app',
  messagingSenderId: '530903277303',
  appId: '1:530903277303:web:05c006bb85b5b4e3bcbdf2',
  measurementId: 'G-9Q08SGT72C',
}

const STORAGE_BUCKET_LEGACY = 'datosdelpaciente-8e3ba.appspot.com'
const STORAGE_BUCKET_NEW = 'datosdelpaciente-8e3ba.firebasestorage.app'

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

/** Secondary app so uploads work if default bucket name mismatches (CORS / wrong bucket). */
const STORAGE_ALT_APP_NAME = 'storage-bucket-alt'
let storageAltApp = null
try {
  const altBucket =
    firebaseConfig.storageBucket === STORAGE_BUCKET_LEGACY ? STORAGE_BUCKET_NEW : STORAGE_BUCKET_LEGACY
  if (!getApps().some((a) => a.name === STORAGE_ALT_APP_NAME)) {
    storageAltApp = initializeApp({ ...firebaseConfig, storageBucket: altBucket }, STORAGE_ALT_APP_NAME)
  } else {
    storageAltApp = getApp(STORAGE_ALT_APP_NAME)
  }
} catch (e) {
  if (!/already exists|duplicate app/i.test(String(e?.message))) {
    console.warn('Firebase storage alt app:', e)
  }
}

const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app, 'us-central1')
const storage = getStorage(app)
const storageAlt = storageAltApp ? getStorage(storageAltApp) : null

/** Try primary storage first, then alternate bucket. */
export function getStorageInstances() {
  const list = [storage]
  if (storageAlt) {
    list.push(storageAlt)
  }
  return list
}

let analytics = null

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app)
      }
    })
    .catch(() => {
      analytics = null
    })
}

let authReadyPromise = null

/**
 * Anonymous sign-in required by Storage rules / callable in this project.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function ensureCallableAuth() {
  if (!authReadyPromise) {
    authReadyPromise = (async () => {
      if (auth.currentUser) {
        return auth.currentUser
      }
      const cred = await signInAnonymously(auth)
      return cred.user
    })().catch((err) => {
      authReadyPromise = null
      throw err
    })
  }
  return authReadyPromise
}

export { app, analytics, auth, db, functions, storage, storageAlt }
