// config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCrsAxBSMYE969AhQOR7aGp3JThXjuRRQI",
  authDomain: "iotauthv1.firebaseapp.com",
  projectId: "iotauthv1",
  storageBucket: "iotauthv1.firebasestorage.app",
  messagingSenderId: "957991587882",
  appId: "1:957991587882:web:f1e30c9ddaed83df7af353",
  measurementId: "G-Q01NKVV861"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
