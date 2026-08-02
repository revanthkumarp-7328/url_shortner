const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../../shared/config');
const db = require('../../shared/database/db');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Handle JSON syntax errors gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ service: 'Auth Service', status: 'UP', timestamp: new Date() });
});

// Register User
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const apiKey = 'sk_live_' + uuidv4().replace(/-/g, '');

    const result = await db.query(
      'INSERT INTO users (email, password_hash, api_key) VALUES ($1, $2, $3) RETURNING id, email, api_key, created_at',
      [email.toLowerCase(), passwordHash, apiKey]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email, apiKey: user.api_key },
    });
  } catch (err) {
    console.error('[Auth Service Register Error]', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login User
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, apiKey: user.api_key },
    });
  } catch (err) {
    console.error('[Auth Service Login Error]', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get User Profile
app.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const result = await db.query('SELECT id, email, api_key, created_at FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ user: { id: user.id, email: user.email, apiKey: user.api_key, createdAt: user.created_at } });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Regenerate API Key
app.post('/api-key/regenerate', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const newApiKey = 'sk_live_' + uuidv4().replace(/-/g, '');

    await db.query('UPDATE users SET api_key = $1 WHERE id = $2', [newApiKey, decoded.userId]);

    res.json({ apiKey: newApiKey, message: 'API Key regenerated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to regenerate API key' });
  }
});

const PORT = config.PORT.AUTH;
app.listen(PORT, () => {
  console.log(`[Auth Microservice] Running on port ${PORT}`);
});
