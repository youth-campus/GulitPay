import axios from 'axios';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
});