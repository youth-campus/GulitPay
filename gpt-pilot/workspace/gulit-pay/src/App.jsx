import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import UserProfile from './components/UserProfile';
import SavingsAccount from './components/SavingsAccount';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token;  // Convert to boolean
  });

  useEffect(() => {
    console.log('Current isLoggedIn state:', isLoggedIn);
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    console.log('User logged out, token removed');
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    console.log('User logged in, token set:', token);
  };

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {!isLoggedIn && (
              <>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/login">Login</Link></li>
              </>
            )}
            {isLoggedIn && (
              <>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/savings">Savings Accounts</Link></li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </>
            )}
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<h1>Welcome to Gulit Pay</h1>} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
          <Route
            path="/profile"
            element={
              isLoggedIn ? <UserProfile /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/savings"
            element={
              isLoggedIn ? <SavingsAccount /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <h2>Dashboard (Protected Route)</h2>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;