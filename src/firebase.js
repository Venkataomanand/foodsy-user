import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDG-s8L6iC2cYnDCAUpX6bZM4p0JRlyt08",
    authDomain: "foodsy-be80f.firebaseapp.com",
    projectId: "foodsy-be80f",
    storageBucket: "foodsy-be80f.firebasestorage.app",
    messagingSenderId: "305068412152",
    appId: "1:305068412152:web:1fd6ef347ae9632b11ff0d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
