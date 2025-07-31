import React, { useState, useEffect } from "react";
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

// Generate a public/private key pair (RSA-OAEP)
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export a public key to a string (for sharing)
export async function exportPublicKey(key) {
  const spki = await window.crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

// Import a public key from a string
export async function importPublicKey(str) {
  const binary = Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "spki",
    binary,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Encrypt a message with a public key
export async function encryptWithPublicKey(message, publicKey) {
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    enc.encode(message)
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decrypt a message with a private key
export async function decryptWithPrivateKey(ciphertext, privateKey) {
  const binary = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    binary
  );
  return new TextDecoder().decode(decrypted);
}

// --- End Asymmetric Encryption Helpers ---

function ChatWindow({ user, selectedUser }) {
  // Demo: Generate and log public/private key pair on mount
  useEffect(() => {
    async function logKeys() {
      const { publicKey, privateKey } = await generateKeyPair();
      const exportedPub = await exportPublicKey(publicKey);
      console.log("Public Key (base64):", exportedPub);
      console.log("Private Key (CryptoKey object):", privateKey);
    }
    logKeys();
  }, []);
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
    await addDoc(collection(db, "chats", chatId, "messages"), {
      uid: user.uid,
      photoURL: user.photoURL,
      displayName: user.displayName,
      message: newMessage,
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
              <p>{message.data.message}</p>
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
