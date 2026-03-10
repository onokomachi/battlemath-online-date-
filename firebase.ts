// Firebase v9 modular SDK
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// battlemath-online Firebase project config (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyDfz022IMbBXCJT_wM2UCmZqexv-KKMtEM",
  authDomain: "battlemath-online.firebaseapp.com",
  projectId: "battlemath-online",
  storageBucket: "battlemath-online.firebasestorage.app",
  messagingSenderId: "492702213499",
  appId: "1:492702213499:web:7680fa2a44be90a77b89de",
  measurementId: "G-19MQYHJJN9"
};

let app: any, auth: any, db: any, storage: any, googleProvider: any, analytics: any;

// Core services (auth, db, storage) - must not fail
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase core initialization error:", error);
}

// Analytics - optional, should not block auth
isAnalyticsSupported().then(supported => {
  if (supported && app) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Analytics init skipped:", e);
    }
  }
}).catch(() => {});

export { app, auth, db, storage, googleProvider, analytics };
