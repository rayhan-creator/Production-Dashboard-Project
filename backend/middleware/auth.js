// ============================================================
// middleware/auth.js
// ============================================================
// JWT authentication + role-based permission guard
//
// ROLES & ACCESS MATRIX:
// ┌─────────────────┬──────────┬──────────┬──────────┬──────────┐
// │ Feature         │SuperAdmin│ Admin    │ PIC Staff│ Approver │
// ├─────────────────┼──────────┼──────────┼──────────┼──────────┤
// │ View all plants │    ✅    │  own BU  │  own BU  │  own BU  │
// │ Manage users    │    ✅    │    ✅    │    ❌    │    ❌    │
// │ View metrics    │    ✅    │    ✅    │    ✅    │    ✅    │
// │ Submit forms    │    ✅    │    ✅    │    ✅    │    ❌    │
// │ Approve/Reject  │    ✅    │    ❌    │    ❌    │    ✅    │
// │ Export data     │    ✅    │    ✅    │    ❌    │    ✅    │
// │ View audit log  │    ✅    │    ❌    │    ❌    │    ❌    │
// └─────────────────┴──────────┴──────────┴──────────┴──────────┘
// ============================================================

const jwt = require('jsonwebtoken');
const { db } = require('../data/db');

// ── Role hierarchy (semakin tinggi angka, semakin tinggi akses) ──
const ROLE_LEVEL = {
  pic_staff:     1,
  approver:      2,
  administrator: 3,
  super_admin:   4,
};

// ── Permission matrix per role ──
const PERMISSIONS = {
  super_admin: [
    'view:all_plants', 'view:metrics', 'view:submissions',
    'manage:users', 'manage:assignments',
    'submit:forms', 'approve:submissions',
    'export:data', 'view:audit_log',
  ],
  administrator: [
    'view:assigned_plants', 'view:metrics', 'view:submissions',
    'manage:users', 'manage:assignments',
    'submit:forms', 'export:data',
  ],
  approver: [
    'view:assigned_plants', 'view:metrics', 'view:submissions',
    'approve:submissions', 'export:data',
  ],
  pic_staff: [
    'view:assigned_plants', 'view:metrics', 'submit:forms',
  ],
};

// ────────────────────────────────────────────
// MIDDLEWARE: verifyToken
// Validasi JWT dari Authorization header
// ────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'NO_TOKEN',
        message: 'Token tidak ditemukan. Silakan login kembali.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek user masih ada & aktif di DB
    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User tidak ditemukan.',
      });
    }

    // Attach user & permissions ke request
    req.user = {
      ...user,
      permissions: PERMISSIONS[user.role] || [],
      level: ROLE_LEVEL[user.role] || 0,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Sesi habis. Silakan login kembali.' });
    }
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Token tidak valid.' });
  }
};

// ────────────────────────────────────────────
// MIDDLEWARE: requirePermission(permission)
// Cek apakah user punya permission tertentu
// Contoh: requirePermission('approve:submissions')
// ────────────────────────────────────────────
const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Belum login.' });

  if (!req.user.permissions.includes(permission)) {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: `Akses ditolak. Role '${req.user.role}' tidak memiliki izin: ${permission}`,
      required: permission,
      userRole: req.user.role,
    });
  }
  next();
};

// ────────────────────────────────────────────
// MIDDLEWARE: requireMinRole(role)
// Cek role minimum (hierarchy-based)
// Contoh: requireMinRole('administrator')
// ────────────────────────────────────────────
const requireMinRole = (minRole) => (req, res, next) => {
  const userLevel = ROLE_LEVEL[req.user?.role] || 0;
  const requiredLevel = ROLE_LEVEL[minRole] || 0;

  if (userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      code: 'INSUFFICIENT_ROLE',
      message: `Akses ditolak. Membutuhkan minimal role: ${minRole}`,
    });
  }
  next();
};

// ────────────────────────────────────────────
// MIDDLEWARE: checkPlantAccess
// Cek apakah user berhak akses ke plant tertentu
// super_admin bisa akses semua, role lain hanya BU mereka
// ────────────────────────────────────────────
const checkPlantAccess = (req, res, next) => {
  const plant = req.query.plant || req.params.plant || req.body.plant;
  if (!plant) return next();

  const { role, bu_access } = req.user;

  if (role === 'super_admin') return next(); // Super admin bypass semua
  if (!bu_access || !bu_access.includes(plant)) {
    return res.status(403).json({
      success: false,
      code: 'PLANT_ACCESS_DENIED',
      message: `Akses ke '${plant}' tidak diizinkan untuk akun Anda.`,
      allowedPlants: bu_access,
    });
  }
  next();
};

module.exports = { verifyToken, requirePermission, requireMinRole, checkPlantAccess, PERMISSIONS, ROLE_LEVEL };
