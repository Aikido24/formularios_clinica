import { doc, getDoc } from 'firebase/firestore'

import { db } from '../firebase.js'

const ACCESS_DOC_PATH = ['user', 'password']
const ACCESS_FIELD = 'pass'

/** @param {unknown} value */
function normalizePassword(value) {
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return null
}

/** @returns {Promise<string | null>} */
export async function fetchSitePassword() {
  const snap = await getDoc(doc(db, ...ACCESS_DOC_PATH))
  if (!snap.exists()) return null
  return normalizePassword(snap.get(ACCESS_FIELD))
}
