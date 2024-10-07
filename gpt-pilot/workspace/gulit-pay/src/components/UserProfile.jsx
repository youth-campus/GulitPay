import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Token before API request:', localStorage.getItem('token'));
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setEditedUser(response.data);
    } catch (err) {
      console.error('Error fetching user profile:', err.message, err.stack);
      setError('Failed to fetch user profile');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser(user);
  };

  const handleChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3001/api/profile', editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(editedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err.message, err.stack);
      setError('Failed to update profile');
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label>Username:</label>
            <input type="text" name="username" value={editedUser.username} onChange={handleChange} required />
          </div>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={editedUser.email} onChange={handleChange} required />
          </div>
          <div>
            <label>First Name:</label>
            <input type="text" name="firstName" value={editedUser.firstName} onChange={handleChange} required />
          </div>
          <div>
            <label>Last Name:</label>
            <input type="text" name="lastName" value={editedUser.lastName} onChange={handleChange} required />
          </div>
          <div>
            <label>Date of Birth:</label>
            <input type="date" name="dateOfBirth" value={editedUser.dateOfBirth} onChange={handleChange} required />
          </div>
          <div>
            <label>Phone Number:</label>
            <input type="tel" name="phoneNumber" value={editedUser.phoneNumber} onChange={handleChange} required />
          </div>
          <button type="submit">Save Changes</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      ) : (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.firstName}</p>
          <p><strong>Last Name:</strong> {user.lastName}</p>
          <p><strong>Date of Birth:</strong> {user.dateOfBirth}</p>
          <p><strong>Phone Number:</strong> {user.phoneNumber}</p>
          <button onClick={handleEdit}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;