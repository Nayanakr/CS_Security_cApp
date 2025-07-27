import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import "./App.css";
import { auth, app } from "../firebase";
import UserDropdown from "./UserDropdown";
import ChatWindow from "./ChatWindow";
import LoginScreen from "./LoginScreen";
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSaved, setUserSaved] = useState(false); // confirmation state

  useEffect(() => {
    // Save user info to Firestore on login
    if (user) {
      setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
      })
        .then(() => {
          setUserSaved(true);
          console.log("User info saved to Firebase!"); // confirmation log
        })
        .catch(() => setUserSaved(false));
    }
  }, [user]);

  const handelSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="app">
      {user ? (
        <>
          <div>
            <span>Logged in as {user.displayName}</span>
            <button className="sign-out-button" onClick={handelSignOut}>
              Sign Out
            </button>
          </div>
          {userSaved && (
            <div style={{ color: "green", marginBottom: 10 }}>
              User info saved to Firebase!
            </div>
          )}
          <UserDropdown
            user={user}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
          <ChatWindow user={user} selectedUser={selectedUser} />
        </>
      ) : (
        <LoginScreen setUser={setUser} />
      )}
    </div>
  );
}

export default App;
