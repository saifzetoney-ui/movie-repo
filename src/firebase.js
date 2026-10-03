import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {addDoc, collection, getFirestore} from "firebase/firestore";
import { toast } from 'react-toastify';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyBVo_Ap1cbwhI8Plwug77cxaV68__N77CQ",

  authDomain: "netflix-app-clone-5cc02.firebaseapp.com",
  projectId: "netflix-app-clone-5cc02",
  storageBucket: "netflix-app-clone-5cc02.firebasestorage.app",
  messagingSenderId: "1013419817936",
  appId: "1:1013419817936:web:58c74f0495e7912b2b57d5"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (name,email, password) => {
    try {
      const res =  await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name,
        authProvider: "local",
        email,
      });
}catch(error){
    console.error("Error signing up:", error);
    toast.error(error.code.split('/')[1].split('-').join(' '));

}

}

const login = async(email, password) => {
    try {
        await signInWithEmailAndPassword(auth, email, password);

       
    } catch (error) {
        console.error("Error logging in:", error);
        toast.error(error.code.split('/')[1].split('-').join(' '));
}
}

const logout = () => {

        signOut(auth);
    }
export { auth, db, signup, login, logout };
