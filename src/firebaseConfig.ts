import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
// If you need Storage later: import { getStorage } from "firebase/storage";

// Debug log for environment variables - REMOVED
// console.log("[firebaseConfig] Environment mode:", import.meta.env.MODE);
// console.log("[firebaseConfig] VITE_USE_FIREBASE_EMULATOR:", import.meta.env.VITE_USE_FIREBASE_EMULATOR);
// console.log("[firebaseConfig] Emulator Flag Type:", typeof import.meta.env.VITE_USE_FIREBASE_EMULATOR);

// Your web app's Firebase configuration
// Using Vite's environment variable convention (import.meta.env)
// Make sure VITE_ prefix is used in your .env file
export const firebaseConfig = {
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
export const storage = getStorage(app);
export const functions = getFunctions(app);
// export const storage = getStorage(app); // Uncomment when Storage is needed

// --- Emulator Connection ---
// Check if the VITE_USE_FIREBASE_EMULATOR flag is set to 'true'
// IMPORTANT: Ensure this flag is set in your .env.development file or similar
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log("[firebaseConfig] Emulator flag is set. Connecting to Firebase Emulators...");
  try {
    // Default emulator ports:
    // Auth: 9099
    // Firestore: 8080 (Check your firebase.json - it might be 8081)
    // Functions: 5001
    // Storage: 9199
    
    // Adjust ports if your firebase.json uses different ones
    const firestorePort = parseInt(import.meta.env.VITE_EMULATOR_FIRESTORE_PORT || '8081'); // Default to 8081 based on emulator logs
    const functionsPort = parseInt(import.meta.env.VITE_EMULATOR_FUNCTIONS_PORT || '5001');
    const authPort = parseInt(import.meta.env.VITE_EMULATOR_AUTH_PORT || '9099');
    const storagePort = parseInt(import.meta.env.VITE_EMULATOR_STORAGE_PORT || '9199');
    
    console.log(`Connecting to Firestore Emulator on port ${firestorePort}`);
    connectFirestoreEmulator(db, "localhost", firestorePort);
    
    console.log(`Connecting to Functions Emulator on port ${functionsPort}`);
    connectFunctionsEmulator(functions, "localhost", functionsPort);

    console.log(`Connecting to Auth Emulator on port ${authPort}`);
    connectAuthEmulator(auth, `http://localhost:${authPort}`);
    
    console.log(`Connecting to Storage Emulator on port ${storagePort}`);
    connectStorageEmulator(storage, "localhost", storagePort);

    console.log("[firebaseConfig] Successfully connected to Firebase Emulators.");
  } catch (error) {
    console.error("[firebaseConfig] Error connecting to Firebase Emulators:", error);
  }
} else {
  console.log("[firebaseConfig] Emulator flag not set or false. Connecting to LIVE Firebase project.");
}

// console.log("Firebase Config:", firebaseConfig); // Remove temporary log 