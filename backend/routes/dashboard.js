// routes/dashboard.js — Metrics, filters, submissions
const router = require('express').Router();
const { db }  = require('../data/db');
const { verifyToken, requirePermission, checkPlantAccess } = require('../middleware/auth');

// Semua route di sini butuh token valid
router.use(verifyToken);

// ── GET /api/dashboard/filters ──
// Ambil daftar plant, period, shift, lines yang boleh diakses user
router.get('/filters', async (req, res) => {
  try {
    const { plant } = req.query;
    const opts = await db.getFilterOptions(plant);

    // Filter plant berdasarkan BU access user
    if (req.user.role !== 'super_admin') {
      opts.plants = opts.plants.filter(p => req.user.bu_access.includes(p));
    }

    res.json({ success: true, data: opts });
  } catch (err) {
    console.error('[Dashboard] Filters error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil filter options.' });
  }
});

// ── GET /api/dashboard/metrics ──
// Ambil data metric berdasarkan tab + plant + period + shift + line
router.get('/metrics', checkPlantAccess, async (req, res) => {
  try {
    const { tab = 'Safety', plant, period, shift, line } = req.query;

    if (!plant || !period) {
      return res.status(400).json({ success: false, message: 'Parameter plant dan period wajib diisi.' });
    }

    const data = await db.getMetrics(tab, plant, period);
    if (!data) {
      return res.status(404).json({
        success: false,
        code: 'DATA_NOT_FOUND',
        message: `Data tidak tersedia untuk kombinasi: ${tab} / ${plant} / ${period}`,
      });
    }

    // Simulasi filter shift & line (di real mode: query WHERE shift=@shift AND line=@line)
    let result = { ...data };
    if (shift && shift !== 'All Shifts') {
      result = applyShiftFilter(result, shift);
    }
    if (line && line !== 'All Lines') {
      result = applyLineFilter(result, line);
    }

    res.json({
      success: true,
      meta: { tab, plant, period, shift: shift || 'All Shifts', line: line || 'All Lines' },
      data: result,
    });
  } catch (err) {
    console.error('[Dashboard] Metrics error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data metrics.' });
  }
});

// ── GET /api/dashboard/submissions ──
// Hanya pic_staff (own) dan approver bisa lihat submissions
router.get('/submissions', requirePermission('view:submissions'), checkPlantAccess, async (req, res) => {
  try {
    const { plant, tab = 'Safety', status } = req.query;
    if (!plant) return res.status(400).json({ success: false, message: 'Parameter plant wajib.' });

    let subs = await db.getSubmissions(plant, tab, status);

    // pic_staff hanya lihat submission miliknya
    if (req.user.role === 'pic_staff') {
      subs = subs.filter(s => s.submittedBy === req.user.name);
    }

    res.json({ success: true, count: subs.length, data: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil submissions.' });
  }
});

// ── PATCH /api/dashboard/submissions/:id ──
// Hanya approver & super_admin yang bisa approve/reject
router.patch('/submissions/:id', requirePermission('approve:submissions'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status harus 'approved' atau 'rejected'." });
    }

    const result = await db.updateSubmissionStatus(id, status, req.user.id);
    res.json({ success: true, message: `Submission ${id} berhasil di-${status}.`, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal update submission.' });
  }
});

// ── GET /api/dashboard/users ──
// Hanya admin+ bisa lihat daftar user
router.get('/users', requirePermission('manage:users'), async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data user.' });
  }
});

// ── Helper: Simulasi filter shift (scale down data sedikit) ──
function applyShiftFilter(data, shift) {
  // Shift modifier: Shift 1 lebih produktif, Shift 3 paling sedikit
  const mod = shift.includes('1') ? 0.38 : shift.includes('2') ? 0.34 : 0.28;
  return {
    ...data,
    production: Math.round(data.production * mod),
    defect:      Math.round(data.defect * mod),
    downtime:    Math.round(data.downtime * mod),
    chart:       data.chart?.map(w => {
      const out = { week: w.week };
      Object.keys(w).forEach(k => { if (k !== 'week') out[k] = typeof w[k] === 'number' ? Math.round(w[k] * mod) : w[k]; });
      return out;
    }),
  };
}

// ── Helper: Simulasi filter line ──
function applyLineFilter(data, line) {
  const lineNum   = parseInt(line.replace(/\D/g, '')) || 1;
  const totalLines = 3;
  const mod = 1 / totalLines + (lineNum % 2 === 0 ? 0.05 : -0.02);
  return {
    ...data,
    production: Math.round(data.production * mod),
    defect:      Math.round(data.defect * mod),
    downtime:    Math.round(data.downtime * mod),
    chart:       data.chart?.map(w => {
      const out = { week: w.week };
      Object.keys(w).forEach(k => { if (k !== 'week') out[k] = typeof w[k] === 'number' ? Math.round(w[k] * mod) : w[k]; });
      return out;
    }),
  };
}

module.exports = router;
