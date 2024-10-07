import React, { useState, useEffect } from 'react';
import { apiClient, getAuthHeaders } from '../utils/api';
import './SavingsAccount.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount);
};

const SavingsAccount = () => {
  const [accounts, setAccounts] = useState([]);
  const [newAccountType, setNewAccountType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState('deposit');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/savings-accounts', getAuthHeaders());
      setAccounts(response.data);
    } catch (err) {
      console.error('Error fetching savings accounts:', err.message, err.stack);
      setError('Failed to fetch accounts');
    }
  };

  const createAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/savings-accounts', { accountType: newAccountType }, getAuthHeaders());
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
      await apiClient.delete(`/savings-accounts/${id}`, getAuthHeaders());
      setAccounts(accounts.filter(account => account.id !== id));
      setSuccess('Account deleted successfully');
      setError('');
    } catch (err) {
      console.error('Error deleting savings account:', err.message, err.stack);
      setError('Failed to delete account');
      setSuccess('');
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/savings-accounts/${selectedAccountId}/transaction`, { type: transactionType, amount: transactionAmount }, getAuthHeaders());
      setAccounts(accounts.map(account => account.id === selectedAccountId ? response.data : account));
      setTransactionAmount('');
      setTransactionType('deposit'); // Resetting transaction type to default after transaction
      setSuccess(`${transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`);
      setError('');
    } catch (err) {
      console.error('Error processing transaction:', err.message, err.stack);
      setError(err.response?.data?.message || 'Failed to process transaction');
      setSuccess('');
    }
  };

  const fetchAccountDetails = async (id) => {
    try {
      const response = await apiClient.get(`/savings-accounts/${id}`, getAuthHeaders());
      setSelectedAccount(response.data);
    } catch (err) {
      console.error('Error fetching account details:', err.message, err.stack);
      setError('Failed to fetch account details');
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
            <button onClick={() => fetchAccountDetails(account.id)}>View Details</button>
          </div>
        ))}
      </div>
      <h3>Make a Transaction</h3>
      <form onSubmit={handleTransaction}>
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          required
        >
          <option value="">Select Account</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.accountType} - {account.accountNumber}
            </option>
          ))}
        </select>
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          required
        >
          <option value="deposit">Deposit</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <input
          type="number"
          value={transactionAmount}
          onChange={(e) => setTransactionAmount(e.target.value)}
          placeholder="Amount"
          required
        />
        <button type="submit">Process Transaction</button>
      </form>
      {selectedAccount && (
        <div className="account-details">
          <h3>Account Details</h3>
          <p>Account Type: {selectedAccount.accountType}</p>
          <p>Account Number: {selectedAccount.accountNumber}</p>
          <p>Current Balance: {formatCurrency(selectedAccount.balance)} {selectedAccount.currency}</p>
          <p>Interest Rate: {(selectedAccount.interestRate * 100).toFixed(2)}%</p>
          <p>Projected Interest: {formatCurrency(selectedAccount.projectedInterest)} {selectedAccount.currency}</p>
          <p>Last Interest Applied: {new Date(selectedAccount.lastInterestApplied).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default SavingsAccount;