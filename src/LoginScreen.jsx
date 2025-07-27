import React, { useEffect } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";

// Accept setUser as a prop to update user in App
function LoginScreen({ setUser }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, [setUser]);

  const handelGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="login-screen">
      <h1>Welcome to Chat App</h1>
      <p style={{ margin: "20px 0" }}>Sign in to start chatting</p>
      <button onClick={handelGoogleSignIn}>Sign in with Google</button>
    </div>
  );
}

export default LoginScreen;
