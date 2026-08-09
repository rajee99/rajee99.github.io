// firebase-config.EXAMPLE.js
// ─────────────────────────────────────────────────────────
// This file shows the STRUCTURE of firebase-config.js.
// The real firebase-config.js is NEVER committed — it is
// generated automatically by GitHub Actions from secrets.
//
// To run locally:
//   1. Copy this file to firebase-config.js
//   2. Fill in your real values from the Firebase console
//   3. DO NOT commit firebase-config.js
// ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "YOUR_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();
