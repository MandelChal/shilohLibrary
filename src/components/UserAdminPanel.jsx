import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';

export default function UserAdminPanel() {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditUser({ ...user });
  };

  const handleUpdate = async () => {
    try {
      const userRef = doc(db, 'users', editUser.id);
      await updateDoc(userRef, {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role
      });
      setUsers(users.map(u => u.id === editUser.id ? editUser : u));
      alert('User updated!');
      setEditUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter((u) => u.id !== uid));
      alert('User deleted');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">User Admin Panel</h2>

      {users.map((user) => (
        <div key={user.id} className="border-b py-4 flex justify-between items-center">
          <div>
            <p className="font-bold">{user.name} ({user.email})</p>
            <p className="text-sm">Role: {user.role}</p>
          </div>
          <div>
            <button
              className="text-blue-600 mr-2 hover:underline"
              onClick={() => handleEdit(user)}
            >
              Edit
            </button>
            <button
              className="text-red-600 hover:underline"
              onClick={() => handleDelete(user.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {editUser && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Edit User</h3>
          <input
            type="text"
            className="block w-full border p-2 mb-2"
            value={editUser.name}
            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
            placeholder="Name"
          />
          <input
            type="email"
            className="block w-full border p-2 mb-2"
            value={editUser.email}
            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            placeholder="Email"
          />
          <input
            type="text"
            className="block w-full border p-2 mb-2"
            value={editUser.role}
            onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
            placeholder="Role"
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={handleUpdate}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}