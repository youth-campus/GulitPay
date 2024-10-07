import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// This is a temporary in-memory storage. In a real application, you'd use a database.
const users = [];
const passwordResetTokens = {};
let savingsAccounts = [];

const JWT_SECRET = process.env.JWT_SECRET || 'e5d1f8e2b3c4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0'; // INPUT_REQUIRED {JWT_SECRET: Secure JWT secret key}

app.post('/api/register', (req, res) => {
  const { username, email, password, firstName, lastName, dateOfBirth, phoneNumber } = req.body;

  // Check if user already exists
  if (users.find(user => user.username === username || user.email === email)) {
    console.log(`Registration attempt failed: Username or email already exists.`);
    return res.status(400).json({ message: 'Username or email already exists' });
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Create new user
  const newUser = {
    username,
    email,
    password: hashedPassword,
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber
  };

  users.push(newUser);

  res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

  passwordResetTokens[resetToken] = {
    userId: user.username,
    expiry: resetTokenExpiry
  };

  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  // In a real application, you would send an email here
  console.log(`Password reset link: ${resetUrl}`);

  res.json({ message: 'Password reset link has been sent to your email' });
});

app.post('/api/reset-password', (req, res) => {
  const { token, password } = req.body;

  if (!passwordResetTokens[token] || passwordResetTokens[token].expiry < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const userId = passwordResetTokens[token].userId;
  const user = users.find(u => u.username === userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  user.password = hashedPassword;

  delete passwordResetTokens[token];

  res.json({ message: 'Password has been reset successfully' });
});

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token provided');
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification error:', err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log('Decoded token:', decoded);
    req.userId = decoded.username;
    next();
  });
};

app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.userId });
});

app.get('/api/profile', verifyToken, (req, res) => {
  const user = users.find(u => u.username === req.userId);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.put('/api/profile', verifyToken, (req, res) => {
  const userIndex = users.findIndex(u => u.username === req.userId);
  if (userIndex !== -1) {
    const updatedUser = { ...users[userIndex], ...req.body };
    users[userIndex] = updatedUser;
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

app.post('/api/savings-accounts', verifyToken, (req, res) => {
  const { accountType } = req.body;
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const newAccount = {
    id: uuidv4(),
    userId: req.userId,
    accountType,
    accountNumber,
    balance: 0,
    currency: 'ETB',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  savingsAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

app.get('/api/savings-accounts/:id', verifyToken, (req, res) => {
  const account = savingsAccounts.find(acc => acc.id === req.params.id && acc.userId === req.userId);
  if (account) {
    res.json(account);
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
});

app.put('/api/savings-accounts/:id', verifyToken, (req, res) => {
  const index = savingsAccounts.findIndex(acc => acc.id === req.params.id && acc.userId === req.userId);
  if (index !== -1) {
    savingsAccounts[index] = { ...savingsAccounts[index], ...req.body, updatedAt: new Date() };
    res.json(savingsAccounts[index]);
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
});

app.delete('/api/savings-accounts/:id', verifyToken, (req, res) => {
  const index = savingsAccounts.findIndex(acc => acc.id === req.params.id && acc.userId === req.userId);
  if (index !== -1) {
    savingsAccounts.splice(index, 1);
    res.json({ message: 'Account deleted successfully' });
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
});

// Error logging
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`, err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});