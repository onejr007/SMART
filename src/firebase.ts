// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase configuration
// Using smart-34bcc for Auth & Analytics
// Using jbakun-62239 for Realtime Database
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDI0fFGqzZgGMah6SqWBqXY3Dequ3l293g",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-34bcc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-34bcc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-34bcc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "543264870207",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:543264870207:web:cbb04de066be95f72f0d8a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-TMKGJSX721",
  // Database URL from jbakun-62239
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, analytics, auth, database };
