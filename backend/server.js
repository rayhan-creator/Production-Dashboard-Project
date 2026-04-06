// ============================================================
// server.js — Denso Dashboard API
// Production ready untuk Render.com
// ============================================================
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── CORS — izinkan Vercel frontend ──
// Render set env var FRONTEND_URL = URL Vercel lu
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean); // hapus undefined/null

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (Postman, curl, mobile)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`Origin ${origin} tidak diizinkan.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight OPTIONS request
app.options('*', cors());

// ── Security headers ──
app.use(helmet({ contentSecurityPolicy: false }));

// ── Body parser ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logger ──
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiter ──
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi nanti.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Terlalu banyak percobaan login.' },
});

// ── Routes ──
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check — Render pakai ini untuk cek server hidup ──
app.get('/api/health', (req, res) => {
  res.json({
    status:  'ok',
    mode:    process.env.DATA_MODE || 'mock',
    time:    new Date().toISOString(),
    version: '2.1.0',
    env:     process.env.NODE_ENV || 'development',
  });
});

// ── Root info page ──
app.get('/', (req, res) => {
  const isDark = true;
  res.send(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Denso Dashboard API</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: monospace; background: #0B0F1E; color: #E2E8F0; padding: 40px 20px; min-height: 100vh; }
  .card { max-width: 520px; margin: 0 auto; }
  h1 { font-size: 22px; color: #00C9A7; margin-bottom: 6px; }
  .sub { font-size: 12px; color: #4B5563; margin-bottom: 30px; }
  .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,201,167,.1); border: 1px solid rgba(0,201,167,.25); border-radius: 99px; padding: 4px 12px; font-size: 11px; color: #00C9A7; margin-bottom: 24px; }
  .dot { width: 7px; height: 7px; background: #00C9A7; border-radius: 50%; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #4B5563; margin-bottom: 10px; }
  .endpoint { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #111827; border: 1px solid rgba(255,255,255,.07); border-radius: 6px; margin-bottom: 6px; font-size: 12px; }
  .method { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 3px; flex-shrink: 0; }
  .get  { background: rgba(0,201,167,.15); color: #00C9A7; }
  .post { background: rgba(108,99,255,.15); color: #6C63FF; }
  .patch{ background: rgba(255,217,61,.15);  color: #FFD93D; }
  .path { color: #E2E8F0; }
  .desc { color: #4B5563; font-size: 11px; margin-left: auto; }
  .link { color: #6C63FF; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .info-row { display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px; }
  .info-key { color: #4B5563; width: 80px; flex-shrink: 0; }
  .info-val { color: #E2E8F0; }
</style>
</head>
<body>
<div class="card">
  <h1>🏭 Denso Dashboard API</h1>
  <p class="sub">PT. Denso Indonesia — PED Division Backend</p>
  <div class="badge"><div class="dot"></div> Running on Render</div>

  <div class="section">
    <div class="section-title">Server Info</div>
    <div class="info-row"><span class="info-key">Mode</span><span class="info-val">${process.env.DATA_MODE || 'mock'}</span></div>
    <div class="info-row"><span class="info-key">Env</span><span class="info-val">${process.env.NODE_ENV || 'development'}</span></div>
    <div class="info-row"><span class="info-key">CORS</span><span class="info-val">${ALLOWED_ORIGINS.join(', ')}</span></div>
    <div class="info-row"><span class="info-key">Frontend</span><span class="info-val"><a class="link" href="${process.env.FRONTEND_URL || '#'}" target="_blank">${process.env.FRONTEND_URL || 'not set'}</a></span></div>
  </div>

  <div class="section">
    <div class="section-title">Endpoints</div>
    <div class="endpoint"><span class="method post">POST</span><span class="path">/api/auth/login</span><span class="desc">Login</span></div>
    <div class="endpoint"><span class="method get">GET</span><span class="path">/api/auth/me</span><span class="desc">Cek token</span></div>
    <div class="endpoint"><span class="method post">POST</span><span class="path">/api/auth/logout</span><span class="desc">Logout</span></div>
    <div class="endpoint"><span class="method get">GET</span><span class="path">/api/dashboard/filters</span><span class="desc">Filter options</span></div>
    <div class="endpoint"><span class="method get">GET</span><span class="path">/api/dashboard/metrics</span><span class="desc">Data metrics</span></div>
    <div class="endpoint"><span class="method get">GET</span><span class="path">/api/dashboard/submissions</span><span class="desc">Submissions</span></div>
    <div class="endpoint"><span class="method patch">PATCH</span><span class="path">/api/dashboard/submissions/:id</span><span class="desc">Update status</span></div>
    <div class="endpoint"><span class="method get">GET</span><span class="path">/api/health</span><span class="desc">Health check</span></div>
  </div>

  <div class="section">
    <div class="section-title">Demo Accounts (password: password123)</div>
    <div class="endpoint"><span class="method get" style="background:rgba(255,107,107,.15);color:#FF6B6B">👑</span><span class="path">superadmin</span><span class="desc">Super Admin</span></div>
    <div class="endpoint"><span class="method get" style="background:rgba(108,99,255,.15);color:#6C63FF">🛡️</span><span class="path">admin_plant_a</span><span class="desc">Administrator</span></div>
    <div class="endpoint"><span class="method get" style="background:rgba(255,217,61,.15);color:#FFD93D">✅</span><span class="path">approver_mgr</span><span class="desc">Approver</span></div>
    <div class="endpoint"><span class="method get" style="background:rgba(0,201,167,.15);color:#00C9A7">📋</span><span class="path">pic_safety</span><span class="desc">PIC Staff</span></div>
  </div>
</div>
</body></html>`);
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route '${req.path}' tidak ditemukan.` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('tidak diizinkan')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n\x1b[32m🏭 Denso Dashboard API — Ready\x1b[0m');
  console.log(`   Port   : \x1b[36m${PORT}\x1b[0m`);
  console.log(`   Mode   : \x1b[33m${process.env.DATA_MODE || 'mock'}\x1b[0m`);
  console.log(`   Env    : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS   : ${ALLOWED_ORIGINS.join(', ')}\n`);
});

module.exports = app;
