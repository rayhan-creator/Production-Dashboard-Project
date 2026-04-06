// middleware/auth.js — JWT auth + role-based permission guard
const jwt    = require('jsonwebtoken');
const { db } = require('../data/db');

const ROLE_LEVEL = {
  pic_staff: 1, approver: 2, administrator: 3, super_admin: 4,
};

const PERMISSIONS = {
  super_admin:   ['view:all_plants','view:metrics','view:submissions','manage:users','manage:assignments','submit:forms','approve:submissions','export:data','view:audit_log'],
  administrator: ['view:assigned_plants','view:metrics','view:submissions','manage:users','manage:assignments','submit:forms','export:data'],
  approver:      ['view:assigned_plants','view:metrics','view:submissions','approve:submissions','export:data'],
  pic_staff:     ['view:assigned_plants','view:metrics','submit:forms'],
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Token tidak ditemukan. Silakan login kembali.' });
    }
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'denso_dev_secret_fallback');
    const user    = await db.findUserById(decoded.id);
    if (!user) return res.status(401).json({ success: false, code: 'USER_NOT_FOUND', message: 'User tidak ditemukan.' });
    req.user = { ...user, permissions: PERMISSIONS[user.role] || [], level: ROLE_LEVEL[user.role] || 0 };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'Sesi habis. Silakan login kembali.' });
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Token tidak valid.' });
  }
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Belum login.' });
  if (!req.user.permissions.includes(permission)) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: `Role '${req.user.role}' tidak memiliki izin: ${permission}` });
  }
  next();
};

const checkPlantAccess = (req, res, next) => {
  const plant = req.query.plant || req.params.plant || req.body?.plant;
  if (!plant) return next();
  if (req.user.role === 'super_admin') return next();
  if (!req.user.bu_access?.includes(plant)) {
    return res.status(403).json({ success: false, code: 'PLANT_ACCESS_DENIED', message: `Akses ke '${plant}' tidak diizinkan.`, allowedPlants: req.user.bu_access });
  }
  next();
};

module.exports = { verifyToken, requirePermission, checkPlantAccess, PERMISSIONS, ROLE_LEVEL };
