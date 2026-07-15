require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

const { connectDB } = require('./config/db');
const { sendMoney, topUpWallet } = require('./controllers/transactionController');
const { signup, login, resetPassword } = require('./controllers/authController');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('[auth] No token provided');
    return res.status(401).json({ message: 'No token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    console.log('[auth] Token verified for user:', req.userId);
    next();
  } catch (err) {
    console.error('[auth] Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);
app.post('/api/auth/reset-password', resetPassword);

// User routes
app.get('/api/users/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (for recipient selection)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ fromUserId: req.userId }, { toUserId: req.userId }],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('fromUserId', 'name email')
      .populate('toUserId', 'name email');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Transaction route with auth
app.post('/api/transactions/send', verifyToken, async (req, res, next) => {
  // Attach app to req for use in controller
  req.app = app;
  await sendMoney(req, res, next);
});

// Wallet top-up (adds amount to the logged-in user's balance)
app.post('/api/wallet/top-up', verifyToken, async (req, res, next) => {
  req.app = app;
  await topUpWallet(req, res, next);
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Real-time WebSocket connection
io.on('connection', (socket) => {
  console.log('[socket] user connected:', socket.id);

  // Join user's personal room
  socket.on('join_user', (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.join(`user_${decoded.userId}`);
      console.log(`[socket] user ${decoded.userId} joined room`);
    } catch (err) {
      console.error('[socket] invalid token:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('[socket] user disconnected:', socket.id);
  });
});

// Emit real-time transaction to user
function emitTransaction(userId, transaction) {
  io.to(`user_${userId}`).emit('new_transaction', transaction);
}

// Export io for use in controllers
app.io = io;
app.emitTransaction = emitTransaction;

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[backend] listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error('[db] failed to connect:', e.message);
    process.exit(1);
  });

