// routes/auth.js — Login, logout, /me
// Password strategy:
//   DATA_MODE=mock → "mock:password123" → compare plain text, no bcrypt needed
//   DATA_MODE=real → bcrypt hash dari SQL Server
const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const { db }  = require('../data/db');
const { verifyToken, PERMISSIONS } = require('../middleware/auth');

// Verifikasi password: mock skip bcrypt, real pakai bcrypt
async function checkPassword(input, stored) {
  if (stored.startsWith('mock:')) {
    return input === stored.slice(5); // slice(5) = hapus prefix "mock:"
  }
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(input, stored);
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const user = await db.findUserByUsername(username.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Username atau password salah.' });
    }

    const valid = await checkPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'denso_dev_secret_fallback',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      message: `Selamat datang, ${user.name}!`,
      token,
      user: { ...safeUser, permissions: PERMISSIONS[user.role] || [] },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/logout
router.post('/logout', verifyToken, (req, res) => {
  console.log('[Auth] Logout:', req.user.username);
  res.json({ success: true, message: 'Logout berhasil.' });
});

module.exports = router;
