import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import schedule from 'node-schedule';
dotenv.config();

console.log('Server starting...');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// This is a temporary in-memory storage. In a real application, you'd use a database.
const users = [];
const passwordResetTokens = {};
const savingsAccounts = [];

const JWT_SECRET = process.env.JWT_SECRET || 'e5d1f8e2b3c4a5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0'; // INPUT_REQUIRED {JWT_SECRET: Secure JWT secret key}

const INTEREST_RATES = {
  'Gullit Regular Saving Account': 0.07,
  'SME Business Account': 0.07,
  'Commercial Account': 0.07,
  'Etege Women Entrepreneurs Account': 0.07
};

const calculateInterest = (balance, rate) => {
  const dailyRate = rate / 365;
  return balance * dailyRate;
};

const applyInterestToAllAccounts = () => {
  console.log('Applying interest to all accounts');
  savingsAccounts.forEach(account => {
    const interestRate = INTEREST_RATES[account.accountType] || 0;
    const interest = calculateInterest(account.balance, interestRate);
    account.balance += interest;
    account.lastInterestApplied = new Date();
    console.log(`Applied ${interest.toFixed(2)} ETB interest to account ${account.accountNumber}`);
  });
};

schedule.scheduleJob('0 0 * * *', applyInterestToAllAccounts);

app.post('/api/register', (req, res) => {
  const { username, email, password, firstName, lastName, dateOfBirth, phoneNumber } = req.body;

  // Check if user already exists
  if (users.find(user => user.username === username || user.email === email)) {
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
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
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

app.get('/api/savings-accounts', verifyToken, (req, res) => {
  const userAccounts = savingsAccounts.filter(account => account.userId === req.userId);
  res.json(userAccounts);
});

app.get('/api/savings-accounts/:id', verifyToken, (req, res) => {
  const account = savingsAccounts.find(acc => acc.id === req.params.id && acc.userId === req.userId);
  if (account) {
    const interestRate = INTEREST_RATES[account.accountType] || 0;
    const lastApplied = account.lastInterestApplied || account.createdAt;
    const daysSinceLastApplication = Math.floor((new Date() - new Date(lastApplied)) / (1000 * 60 * 60 * 24));
    const projectedInterest = calculateInterest(account.balance, interestRate) * daysSinceLastApplication;
    res.json({
      ...account,
      interestRate,
      projectedInterest,
      lastInterestApplied: lastApplied
    });
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

app.post('/api/savings-accounts/:id/transaction', verifyToken, (req, res) => {
  const { id } = req.params;
  const { type, amount } = req.body;

  const account = savingsAccounts.find(acc => acc.id === id && acc.userId === req.userId);

  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }

  if (type === 'deposit') {
    account.balance += parseFloat(amount);
  } else if (type === 'withdrawal') {
    if (account.balance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    account.balance -= parseFloat(amount);
  } else {
    return res.status(400).json({ message: 'Invalid transaction type' });
  }

  account.updatedAt = new Date();

  res.json(account);
});

// Error logging
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`, err.stack);
  res.status(500).send('Something broke!');
});

app.get('/api/test', (req, res) => {
  console.log('Test route accessed');
  res.json({ message: 'Server is running' });
});

app.listen(port, () => {
  console.log('Routes registered:');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(r.route.stack[0].method.toUpperCase() + ' ' + r.route.path);
    }
  });
  console.log(`Server running on port ${port}`);
});