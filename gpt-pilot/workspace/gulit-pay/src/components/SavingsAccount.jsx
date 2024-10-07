import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SavingsAccount.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount);
};

const SavingsAccount = () => {
  const [accounts, setAccounts] = useState([]);
  const [newAccountType, setNewAccountType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/savings-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching savings accounts:', err.message, err.stack);
      setError('Failed to fetch accounts');
    }
  };

  const createAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/savings-accounts',
        { accountType: newAccountType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAccounts([...accounts, response.data]);
      setNewAccountType('');
      setSuccess('Account created successfully');
      setError('');
    } catch (err) {
      console.error('Error creating savings account:', err.message, err.stack);
      setError('Failed to create account');
      setSuccess('');
    }
  };

  const deleteAccount = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/savings-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(accounts.filter(account => account.id !== id));
      setSuccess('Account deleted successfully');
      setError('');
    } catch (err) {
      console.error('Error deleting savings account:', err.message, err.stack);
      setError('Failed to delete account');
      setSuccess('');
    }
  };

  return (
    <div className="savings-account-container">
      <h2>Savings Accounts</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={createAccount}>
        <select
          value={newAccountType}
          onChange={(e) => setNewAccountType(e.target.value)}
          required
        >
          <option value="">Select Account Type</option>
          <option value="Gullit Regular Saving Account">Gullit Regular Saving Account</option>
          <option value="SME Business Account">SME Business Account</option>
          <option value="Commercial Account">Commercial Account</option>
          <option value="Etege Women Entrepreneurs Account">Etege Women Entrepreneurs Account</option>
        </select>
        <button type="submit">Create Account</button>
      </form>
      <div className="account-list">
        {accounts.map(account => (
          <div key={account.id} className="account-item">
            <h3>{account.accountType}</h3>
            <p>Account Number: {account.accountNumber}</p>
            <p>Balance: {formatCurrency(account.balance)} {account.currency}</p>
            <button onClick={() => deleteAccount(account.id)}>Delete Account</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavingsAccount;