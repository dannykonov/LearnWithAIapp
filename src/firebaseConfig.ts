import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// If you need Storage later: import { getStorage } from "firebase/storage";

// Debug log for environment variables
console.log("Environment mode:", import.meta.env.MODE);
console.log("Using Firebase emulator:", Boolean(import.meta.env.VITE_USE_FIREBASE_EMULATOR));

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

// Connect to Firebase emulator if in development
if (import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log("Connecting to Firebase emulators");
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8090);
    console.log("Successfully connected to Firebase emulators");
  } catch (error) {
    console.error("Failed to connect to Firebase emulators:", error);
  }
}

console.log("Firebase initialized with config:", Object.keys(firebaseConfig).join(", "));

// console.log("Firebase Config:", firebaseConfig); // Remove temporary log 