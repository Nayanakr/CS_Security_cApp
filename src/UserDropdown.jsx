import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

function UserDropdown({ user, selectedUser, setSelectedUser }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user) {
      const fetchUsers = async () => {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(
          usersSnapshot.docs
            .map((doc) => doc.data())
            .filter((u) => u.uid !== user.uid)
        );
      };
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    // Debug: log users to verify fetching
    console.log("Fetched users:", users);
  }, [users]);

  return (
    <div>
      <h3>Select a user to chat with:</h3>
      <select
        value={selectedUser ? selectedUser.uid : ""}
        onChange={(e) => {
          const selected = users.find((u) => u.uid === e.target.value);
          setSelectedUser(selected || null);
        }}
      >
        <option value="">-- Select User --</option>
        {users.map((u) => (
          <option key={u.uid} value={u.uid}>
            {u.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default UserDropdown;
