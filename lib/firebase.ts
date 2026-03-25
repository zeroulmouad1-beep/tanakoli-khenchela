import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: 'AIzaSyCz62DFbbD89fpYUXdg38nRCohX-yTJ4z8',
  authDomain: 'tanakoli-khenchela.firebaseapp.com',
  projectId: 'tanakoli-khenchela',
  storageBucket: 'tanakoli-khenchela.firebasestorage.app',
  messagingSenderId: '757217321198',
  appId: '1:757217321198:web:1cbdfd808a180b6ff9d3ff',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// initializeFirestore() must only be called once per app.
// The try/catch handles:
//   • Already-initialized app (HMR / multiple imports)
//   • Environments without IndexedDB/BroadcastChannel (private mode, old browsers)
// In both failure cases, getFirestore() returns the existing or a plain instance.
function buildDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    })
  } catch {
    return getFirestore(app)
  }
}

export const db = buildDb()
export const auth = getAuth(app)
