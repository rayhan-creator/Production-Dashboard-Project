// server.js — Entry point backend Denso Dashboard API
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi nanti.' },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Terlalu banyak percobaan login.' },
});

// ── Routes ──
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode:    process.env.DATA_MODE || 'mock',
    time:    new Date().toISOString(),
    version: '2.0.0',
  });
});

// ── Root: info page (supaya tidak 404 saat dibuka di browser) ──
app.get('/', (req, res) => {
  res.send(`
    <html><body style="font-family:monospace;background:#0B0F1E;color:#00C9A7;padding:40px">
    <h2>🏭 Denso Dashboard API</h2>
    <p style="color:#8892A4">Backend berjalan normal. Frontend ada di <a href="http://localhost:5173" style="color:#00C9A7">localhost:5173</a></p>
    <hr style="border-color:#1A2035">
    <p><b>Endpoints:</b></p>
    <pre style="color:#E2E8F0">
  POST  /api/auth/login
  GET   /api/auth/me
  POST  /api/auth/logout
  GET   /api/dashboard/filters
  GET   /api/dashboard/metrics
  GET   /api/dashboard/submissions
  GET   /api/health
    </pre>
    <p style="color:#4B5563">Mode: ${process.env.DATA_MODE || 'mock'} | Port: ${PORT}</p>
    </body></html>
  `);
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route '${req.path}' tidak ditemukan.` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log('\n\x1b[32m🏭 Denso Dashboard API\x1b[0m');
  console.log(`   URL    : \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`   Mode   : \x1b[33m${process.env.DATA_MODE || 'mock'}\x1b[0m`);
  console.log(`   Env    : ${process.env.NODE_ENV || 'development'}`);
  console.log('\n\x1b[32m📋 Test accounts (password: password123):\x1b[0m');
  console.log('   \x1b[31msuperadmin\x1b[0m    → Super Admin, semua plant');
  console.log('   \x1b[35madmin_plant_a\x1b[0m → Administrator, Plant A');
  console.log('   \x1b[36mapprover_mgr\x1b[0m  → Approver, Plant A & B');
  console.log('   \x1b[32mpic_safety\x1b[0m    → PIC Staff, Plant A\n');
});

module.exports = app;
