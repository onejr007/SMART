// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

// 1. Firebase configuration for Hosting & Analytics (smart-34bcc)
const hostingConfig = {
  apiKey: "AIzaSyDI0fFGqzZgGMah6SqWBqXY3Dequ3l293g",
  authDomain: "smart-34bcc.firebaseapp.com",
  projectId: "smart-34bcc",
  storageBucket: "smart-34bcc.firebasestorage.app",
  messagingSenderId: "543264870207",
  appId: "1:543264870207:web:cbb04de066be95f72f0d8a",
  measurementId: "G-TMKGJSX721"
};

// 2. Firebase configuration for Database (jbakun-62239)
// IMPORTANT: This is a SEPARATE Firebase project used ONLY for Realtime Database
// Database URL with auth secret for write access
const dbConfig = {
  databaseURL: "https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app/?auth=OPQ2iJqS1MOK0HjA1esCyvHCnJzN4zcZm0ym2iRxINGAT",
  projectId: "jbakun-62239"
};

// Initialize Primary App (Hosting & Analytics)
const app = initializeApp(hostingConfig, "PRIMARY_APP");
const analytics = getAnalytics(app);

// Initialize Secondary App (Database Only - untuk user data dan game data)
const dbApp = initializeApp(dbConfig, "DATABASE_APP");
const database = getDatabase(dbApp); // Database dari jbakun-62239 dengan auth secret

export { app, analytics, database };
