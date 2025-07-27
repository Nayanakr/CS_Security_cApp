import React, { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

// Shared secret key for AES encryption (for demo)
const SHARED_KEY = "my_super_secret_key_123!";

// Encryption helper functions
export function encryptMessage(message, key = SHARED_KEY) {
  const encrypted = CryptoJS.AES.encrypt(message, key).toString();
  console.log("Encrypting message:", message, "->", encrypted);
  return encrypted;
}

export function decryptMessage(ciphertext, key = SHARED_KEY) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    console.log("Decrypting message:", ciphertext, "->", decrypted);
    return decrypted;
  } catch (e) {
    console.error("Decryption failed for:", ciphertext, e);
    return "[Decryption failed]";
  }
}

function ChatWindow({
  user,
  selectedUser,
  encrypt = encryptMessage,
  decrypt = decryptMessage,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!user || !selectedUser) return;
    const chatId =
      user.uid < selectedUser.uid
        ? `${user.uid}_${selectedUser.uid}`
        : `${selectedUser.uid}_${user.uid}`;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
      console.log("Fetched messages from Firestore:", msgs);
      setMessages(msgs);
    });
    return unsubscribe;
  }, [user, selectedUser]);

  const sendMessage = async () => {
    if (!selectedUser || !newMessage.trim()) return;
    const chatId =
      user.uid < selectedUser.uid
        ? `${user.uid}_${selectedUser.uid}`
        : `${selectedUser.uid}_${user.uid}`;
    const encrypted = encrypt(newMessage);
    console.log("Sending encrypted message:", encrypted);
    await addDoc(collection(db, "chats", chatId, "messages"), {
      uid: user.uid,
      photoURL: user.photoURL,
      displayName: user.displayName,
      message: encrypted,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  return selectedUser ? (
    <>
      <div>
        <h4>Chatting with {selectedUser.displayName}</h4>
      </div>
      <div className="message-container">
        {messages.map((message) => (
          <div className="message-item" key={message.id}>
            <img src={message.data.photoURL} alt={message.data.displayName} />
            <div className="message-content">
              <p>{decrypt(message.data.message)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </>
  ) : (
    <div>Select a user to start chatting.</div>
  );
}

export default ChatWindow;
