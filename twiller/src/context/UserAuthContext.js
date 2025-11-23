import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth ,googleProvider  } from "./firebase";

const userAuthContext = createContext();

export function UserAuthContextProvider({ children }) {
  const [user, setUser] = useState({});

  // Login
  function logIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Signup
  function signUp(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Logout
  function logOut() {
    return signOut(auth);
  }

  // Google Sign In
  // function googleSignIn() {
  //   const googleProvider = new GoogleAuthProvider();
  //   return signInWithPopup(auth, googleProvider);
  // }

  const googleSignIn = () => {
    return signInWithPopup(auth, googleProvider);
  };
  // Forgot Password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <userAuthContext.Provider
      value={{ user, logIn, signUp, logOut, googleSignIn, resetPassword }}
    >
      {children}
    </userAuthContext.Provider>
  );
}

export function useUserAuth() {
  return useContext(userAuthContext);
}
