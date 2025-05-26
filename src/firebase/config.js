import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// Secondary Firebase configuration for inventory database
const inventoryFirebaseConfig = {
  apiKey: "AIzaSyDPQCaNnxmRuEeZTUvPi_2bK1K1t2z3iXc",
  authDomain: "mswasth-inventory-7aa83.firebaseapp.com",
  databaseURL: "https://mswasth-inventory-7aa83-default-rtdb.firebaseio.com",
  projectId: "mswasth-inventory-7aa83",
  storageBucket: "mswasth-inventory-7aa83.applestorage.app",
  messagingSenderId: "172554273866",
  appId: "1:172554273866:web:4d7cd37f729f22ecc1d2b3",
  measurementId: "G-NH399QWVLF"
};

const app = initializeApp(firebaseConfig);
const inventoryApp = initializeApp(inventoryFirebaseConfig, "inventoryApp");

export const auth = getAuth(app);
export const database = getDatabase(app);
export const inventoryDatabase = getDatabase(inventoryApp);
