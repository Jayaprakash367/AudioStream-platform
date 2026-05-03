/**
 * ═══════════════════════════════════════════════════════════════
 * Auralux X — Standalone Auth Backend
 * Express + MongoDB + JWT
 * Port: 3001
 *
 * Endpoints:
 *   POST /auth/register   — Create new user account
 *   POST /auth/login      — Login with email + password + rememberMe
 *   POST /auth/logout     — Revoke refresh token + blacklist access token
 *   GET  /auth/me         — Return session profile (validate token)
 *   POST /auth/refresh    — Exchange refresh token for new token pair
 *   GET  /health          — Health check
 *
 * Storage: MongoDB (with in-memory fallback if Mongo unreachable)
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ─── Config ────────────────────────────────────────────────────────────────

const CONFIG = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/auralux_auth',
  jwtSecret: process.env.JWT_SECRET || 'auralux-jwt-secret-dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'auralux-refresh-secret-dev',
  jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '900', 10),       // seconds
  refreshExpiresDays: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '30', 10),
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// ─── In-Memory Fallback Store (when MongoDB is unavailable) ────────────────

const memStore = {
  users: new Map(),     // email → user document
  blacklist: new Set(), // Set of blacklisted jti strings
};

let usingMongo = false;

// ─── Mongoose Schemas ──────────────────────────────────────────────────────

const RefreshTokenSchema = new mongoose.Schema({
  token:     { type: String, required: true },
  expiresAt: { type: Date,   required: true },
  createdAt: { type: Date,   default: Date.now },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  isRevoked: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema(
  {
    userId:       { type: String, required: true, unique: true, index: true },
    email:        { type: String, required: true, unique: true, lowercase: true, index: true },
    username:     { type: String, required: true, unique: true, lowercase: true, index: true },
    displayName:  { type: String, required: true },
    passwordHash: { type: String, required: true },

    // Auth fields
    refreshTokens:          { type: [RefreshTokenSchema], default: [] },
    isEmailVerified:        { type: Boolean, default: false },
    failedLoginAttempts:    { type: Number, default: 0 },
    lockoutUntil:           { type: Date, default: null },
    emailVerificationToken: { type: String, default: null },

    // Profile fields
    avatarUrl:    { type: String, default: null },
    role:         { type: String, default: 'LISTENER', enum: ['LISTENER', 'ARTIST', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'] },
    subscription: { type: String, default: 'FREE',     enum: ['FREE', 'PREMIUM', 'FAMILY', 'STUDENT'] },
    lastLoginAt:  { type: Date, default: null },

    // Token blacklist (simple approach without Redis)
    blacklistedJtis: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'users' }
);

// Compound index for fast login lookup
UserSchema.index({ email: 1, isEmailVerified: 1 });
UserSchema.index({ 'refreshTokens.token': 1 }, { sparse: true });

let User = null;

// ─── Connect MongoDB ───────────────────────────────────────────────────────

async function connectMongo() {
  try {
    await mongoose.connect(CONFIG.mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    User = mongoose.model('User', UserSchema);
    usingMongo = true;
    console.log(`✅ MongoDB connected → ${CONFIG.mongoUri}`);
  } catch (err) {
    console.warn(`⚠️  MongoDB unavailable (${err.message})`);
    console.warn('   Running with IN-MEMORY storage (data lost on restart)');
    console.warn('   Install MongoDB or set MONGO_URI to a valid connection string');
    usingMongo = false;
  }
}

// ─── DB Abstraction (works for both Mongo + in-memory) ───────────────────

async function findUserByEmail(email) {
  const e = email.toLowerCase();
  if (usingMongo) return User.findOne({ email: e });
  return memStore.users.get(e) || null;
}

async function findUserById(userId) {
  if (usingMongo) return User.findOne({ userId });
  for (const u of memStore.users.values()) {
    if (u.userId === userId) return u;
  }
  return null;
}

async function findUserByUsername(username) {
  const u = username.toLowerCase();
  if (usingMongo) return User.findOne({ username: u });
  for (const usr of memStore.users.values()) {
    if (usr.username === u) return usr;
  }
  return null;
}

async function saveUser(userDoc) {
  if (usingMongo) {
    return userDoc.save();
  }
  // In-memory: userDoc is a plain object
  memStore.users.set(userDoc.email, userDoc);
  return userDoc;
}

async function createUser(data) {
  if (usingMongo) {
    return User.create(data);
  }
  const doc = {
    ...data,
    refreshTokens: [],
    isEmailVerified: false,
    failedLoginAttempts: 0,
    lockoutUntil: null,
    blacklistedJtis: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async function () {
      memStore.users.set(this.email, this);
      return this;
    },
  };
  memStore.users.set(data.email, doc);
  return doc;
}

// ─── JWT Helpers ───────────────────────────────────────────────────────────

function signAccessToken(payload) {
  return jwt.sign(payload, CONFIG.jwtSecret, { expiresIn: CONFIG.jwtExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, CONFIG.jwtRefreshSecret, {
    expiresIn: CONFIG.refreshExpiresDays * 24 * 3600,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, CONFIG.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, CONFIG.jwtRefreshSecret);
}

// ─── Middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing auth token' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// ─── Express App ──────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: CONFIG.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-request-id'],
}));

app.use(express.json({ limit: '1mb' }));

// Log every request in dev
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health Check ──────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'auralux-auth',
    storage: usingMongo ? 'mongodb' : 'memory',
    mongoConnected: usingMongo,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /auth/register ───────────────────────────────────────────────────

app.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Validation
    if (!email || !username || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'email, username, password, and displayName are required',
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // Check duplicates
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ success: false, error: 'Username already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, CONFIG.bcryptRounds);
    const userId = crypto.randomUUID();

    // Create user
    const user = await createUser({
      userId,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      passwordHash,
      role: 'LISTENER',
      subscription: 'FREE',
      isEmailVerified: false,
    });

    // Issue tokens
    const jti = crypto.randomUUID();
    const accessToken = signAccessToken({
      sub: userId,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      role: 'LISTENER',
      subscription: 'FREE',
      jti,
    });

    const refreshTokenStr = crypto.randomBytes(64).toString('hex');
    const refreshExpiry = new Date(Date.now() + CONFIG.refreshExpiresDays * 24 * 3600 * 1000);

    if (usingMongo) {
      user.refreshTokens.push({
        token: refreshTokenStr,
        expiresAt: refreshExpiry,
        createdAt: new Date(),
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
        isRevoked: false,
      });
      await user.save();
    }

    console.log(`✅ Registered new user: ${email}`);

    return res.status(201).json({
      success: true,
      data: {
        userId,
        accessToken,
        refreshToken: refreshTokenStr,
        expiresIn: CONFIG.jwtExpiresIn,
        tokenType: 'Bearer',
        user: {
          userId,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          displayName,
          role: 'LISTENER',
          subscription: 'FREE',
          isEmailVerified: false,
        },
      },
    });
  } catch (err) {
    console.error('[/auth/register]', err);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// ─── POST /auth/login ──────────────────────────────────────────────────────

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Check lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const remaining = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Account locked. Try again in ${remaining} minute(s)`,
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
        console.warn(`🔒 Account locked: ${email} (5 failed attempts)`);
      }

      await saveUser(user);
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.lastLoginAt = new Date();

    // Generate token pair
    const jti = crypto.randomUUID();
    const expiresDays = rememberMe ? CONFIG.refreshExpiresDays : 1;
    const accessToken = signAccessToken({
      sub: user.userId,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role || 'LISTENER',
      subscription: user.subscription || 'FREE',
      jti,
    });

    const refreshTokenStr = crypto.randomBytes(64).toString('hex');
    const refreshExpiry = new Date(Date.now() + expiresDays * 24 * 3600 * 1000);

    // Store refresh token
    if (usingMongo) {
      // Prune expired/revoked tokens first
      user.refreshTokens = (user.refreshTokens || []).filter(
        (rt) => rt.expiresAt > new Date() && !rt.isRevoked
      );

      user.refreshTokens.push({
        token: refreshTokenStr,
        expiresAt: refreshExpiry,
        createdAt: new Date(),
        userAgent: req.headers['user-agent'] || '',
        ipAddress: req.ip || '',
        isRevoked: false,
      });

      // Max 5 active sessions
      const active = user.refreshTokens.filter((rt) => !rt.isRevoked);
      if (active.length > 5) {
        const oldest = active.sort((a, b) => a.createdAt - b.createdAt)[0];
        oldest.isRevoked = true;
      }

      await user.save();
    }

    console.log(`✅ Login: ${email} (rememberMe=${rememberMe})`);

    return res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        accessToken,
        refreshToken: refreshTokenStr,
        expiresIn: CONFIG.jwtExpiresIn,
        tokenType: 'Bearer',
        rememberMe,
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role || 'LISTENER',
          subscription: user.subscription || 'FREE',
          isEmailVerified: user.isEmailVerified || false,
          avatarUrl: user.avatarUrl || null,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (err) {
    console.error('[/auth/login]', err);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────

app.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.sub;
    const jti = req.user.jti;

    if (usingMongo) {
      const user = await findUserById(userId);
      if (user) {
        if (refreshToken) {
          // Revoke the specific refresh token
          const rt = user.refreshTokens.find((t) => t.token === refreshToken);
          if (rt) rt.isRevoked = true;
        } else {
          // Logout from all devices
          user.refreshTokens.forEach((rt) => { rt.isRevoked = true; });
        }

        // Blacklist the current access token's JTI
        if (jti) {
          user.blacklistedJtis = user.blacklistedJtis || [];
          user.blacklistedJtis.push(jti);
          // Cap at 20 stored JTIs (cleanup)
          if (user.blacklistedJtis.length > 20) {
            user.blacklistedJtis = user.blacklistedJtis.slice(-20);
          }
        }

        await user.save();
      }
    } else {
      // In-memory: just track the JTI as blacklisted
      if (jti) memStore.blacklist.add(jti);
    }

    console.log(`✅ Logout: userId=${userId}`);

    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    console.error('[/auth/logout]', err);
    return res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// ─── GET /auth/me ──────────────────────────────────────────────────────────

app.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const jti = req.user.jti;

    // Check if token JTI is blacklisted (user logged out)
    if (usingMongo) {
      const user = await findUserById(userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      if (user.blacklistedJtis && user.blacklistedJtis.includes(jti)) {
        return res.status(401).json({ success: false, error: 'Token revoked' });
      }

      return res.status(200).json({
        success: true,
        data: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role || 'LISTENER',
          subscription: user.subscription || 'FREE',
          isEmailVerified: user.isEmailVerified || false,
          avatarUrl: user.avatarUrl || null,
          lastLoginAt: user.lastLoginAt,
        },
      });
    } else {
      // In-memory: check blacklist
      if (memStore.blacklist.has(jti)) {
        return res.status(401).json({ success: false, error: 'Token revoked' });
      }

      // Return data from the JWT payload itself
      return res.status(200).json({
        success: true,
        data: {
          userId: req.user.sub,
          email: req.user.email,
          username: req.user.username,
          displayName: req.user.displayName,
          role: req.user.role || 'LISTENER',
          subscription: req.user.subscription || 'FREE',
          isEmailVerified: false,
          avatarUrl: null,
        },
      });
    }
  } catch (err) {
    console.error('[/auth/me]', err);
    return res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// ─── POST /auth/refresh ────────────────────────────────────────────────────

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'refreshToken is required' });
    }

    if (!usingMongo) {
      return res.status(501).json({
        success: false,
        error: 'Token refresh requires MongoDB',
      });
    }

    // Find the user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.isRevoked': false,
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const tokenEntry = user.refreshTokens.find(
      (rt) => rt.token === refreshToken && !rt.isRevoked
    );

    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      return res.status(401).json({ success: false, error: 'Refresh token expired' });
    }

    // Revoke old token (rotation pattern)
    tokenEntry.isRevoked = true;

    // Issue new token pair
    const jti = crypto.randomUUID();
    const wasRememberMe = (tokenEntry.expiresAt - tokenEntry.createdAt) > (2 * 24 * 3600 * 1000);
    const expiresDays = wasRememberMe ? CONFIG.refreshExpiresDays : 1;

    const accessToken = signAccessToken({
      sub: user.userId,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role || 'LISTENER',
      subscription: user.subscription || 'FREE',
      jti,
    });

    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiry = new Date(Date.now() + expiresDays * 24 * 3600 * 1000);

    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: refreshExpiry,
      createdAt: new Date(),
      userAgent: tokenEntry.userAgent,
      ipAddress: tokenEntry.ipAddress,
      isRevoked: false,
    });

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: CONFIG.jwtExpiresIn,
        tokenType: 'Bearer',
      },
    });
  } catch (err) {
    console.error('[/auth/refresh]', err);
    return res.status(500).json({ success: false, error: 'Token refresh failed' });
  }
});

// ─── POST /auth/validate (for API gateway) ────────────────────────────────

app.post('/auth/validate', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'token required' });

    const decoded = verifyAccessToken(token);

    // Check if JTI is blacklisted
    if (usingMongo) {
      const user = await findUserById(decoded.sub);
      if (user && user.blacklistedJtis && user.blacklistedJtis.includes(decoded.jti)) {
        return res.status(401).json({ success: false, error: 'Token revoked' });
      }
    } else {
      if (memStore.blacklist.has(decoded.jti)) {
        return res.status(401).json({ success: false, error: 'Token revoked' });
      }
    }

    return res.status(200).json({ success: true, data: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// ─── 404 Handler ───────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Error Handler ─────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────

async function start() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🎵 Auralux X — Auth Backend');
  console.log('═══════════════════════════════════════════════════');

  await connectMongo();

  app.listen(CONFIG.port, () => {
    console.log('');
    console.log(`  ✅ Auth service running on http://localhost:${CONFIG.port}`);
    console.log(`  📦 Storage: ${usingMongo ? 'MongoDB (' + CONFIG.mongoUri + ')' : 'In-Memory (dev mode)'}`);
    console.log(`  🔑 JWT expiry: ${CONFIG.jwtExpiresIn}s access, ${CONFIG.refreshExpiresDays}d refresh`);
    console.log(`  🌐 CORS allowed: ${CONFIG.corsOrigin}`);
    console.log('');
    console.log('  Endpoints:');
    console.log(`    POST http://localhost:${CONFIG.port}/auth/register`);
    console.log(`    POST http://localhost:${CONFIG.port}/auth/login`);
    console.log(`    POST http://localhost:${CONFIG.port}/auth/logout`);
    console.log(`    GET  http://localhost:${CONFIG.port}/auth/me`);
    console.log(`    POST http://localhost:${CONFIG.port}/auth/refresh`);
    console.log(`    GET  http://localhost:${CONFIG.port}/health`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  });
}

start().catch((err) => {
  console.error('❌ Failed to start auth backend:', err);
  process.exit(1);
});
