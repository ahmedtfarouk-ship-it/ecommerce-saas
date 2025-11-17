// lib/firebase/config.ts

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAsfyCE0XA9hRt6SuS5MBvd0Z2cimyRpsM",
  authDomain: "ecommerce-saas-system.firebaseapp.com",
  projectId: "ecommerce-saas-system",
  storageBucket: "ecommerce-saas-system.firebasestorage.app",
  messagingSenderId: "745205617913",
  appId: "1:745205617913:web:4855770399e43d4863be28",
  measurementId: "G-HVTB3VH2M2"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export default app;