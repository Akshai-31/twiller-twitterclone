
import { initializeApp } from "firebase/app";
 //import { getAuth } from "firebase/auth";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkV1ihMIVUevdEdOORE2b4cMrk7OzpL5g",
  authDomain: "twitter-clone-51b8b.firebaseapp.com",
  projectId: "twitter-clone-51b8b",
  storageBucket: "twitter-clone-51b8b.firebasestorage.app",
  messagingSenderId: "275323801893",
  appId: "1:275323801893:web:1d5e4bb05ffeb3bf758acc",
  measurementId: "G-GF9CMBHVT6"
};


const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
export const googleProvider = new GoogleAuthProvider();
export default app
// const analytics = getAnalytics(app);
