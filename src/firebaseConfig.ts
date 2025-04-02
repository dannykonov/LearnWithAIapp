import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// If you need Storage later: import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Using Vite's environment variable convention (import.meta.env)
// Make sure VITE_ prefix is used in your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the already initialized app
}

// Export the necessary Firebase services
export const firebaseApp = app;
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); // Uncomment when Storage is needed

// console.log("Firebase Config:", firebaseConfig); // Remove temporary log 