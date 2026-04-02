// ============================================================
// data/db.js
// ============================================================
// Layer database universal:
//   - DATA_MODE=mock  → pakai dummy data (default untuk dev)
//   - DATA_MODE=real  → konek ke SQL Server Denso beneran
//
// Dengan pattern ini, frontend tetap jalan walau SQL Server
// belum terkonfigurasi. Tinggal ganti DATA_MODE di .env saat siap.
// ============================================================

require('dotenv').config();
const sql = process.env.DATA_MODE === 'real' ? require('mssql') : null;

// ── SQL Server config (hanya dipakai kalau DATA_MODE=real) ──
const sqlConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port:     parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt:              process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true',
    enableArithAbort:     true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

// ── Koneksi pool (singleton) ──
let poolPromise = null;
async function getPool() {
  if (!poolPromise) poolPromise = sql.connect(sqlConfig);
  return poolPromise;
}

// ────────────────────────────────────────────
// MOCK DATA — Data dummy lengkap untuk dev
// ────────────────────────────────────────────
const MOCK = {
  users: [
    {
      id: 1, username: 'superadmin', name: 'Budi Santoso',
      password: 'mock:password123', // "password123"
      role: 'super_admin', bu_access: ['Plant A','Plant B','Plant C'],
      department: 'IT', avatar: 'BS', active: true
    },
    {
      id: 2, username: 'admin_plant_a', name: 'Siti Rahma',
      password: 'mock:password123',
      role: 'administrator', bu_access: ['Plant A'],
      department: 'PED', avatar: 'SR', active: true
    },
    {
      id: 3, username: 'pic_safety', name: 'Ahmad Fauzi',
      password: 'mock:password123',
      role: 'pic_staff', bu_access: ['Plant A'],
      department: 'Safety', avatar: 'AF', active: true
    },
    {
      id: 4, username: 'approver_mgr', name: 'Dewi Kusuma',
      password: 'mock:password123',
      role: 'approver', bu_access: ['Plant A', 'Plant B'],
      department: 'Management', avatar: 'DK', active: true
    },
    {
      id: 5, username: 'pic_quality', name: 'Reza Pratama',
      password: 'mock:password123',
      role: 'pic_staff', bu_access: ['Plant B'],
      department: 'Quality', avatar: 'RP', active: true
    },
  ],

  // Metric data per tab → plant → period
  metrics: {
    Safety: {
      'Plant A': {
        'Jan 2025': { production:980, defect:12, efficiency:87.5, downtime:45, oee:82.3, incidents:2,
          trend:{ production:3.2, defect:-8.5, efficiency:1.1, incidents:-50 },
          chart:[{week:'W1',incidents:1,nearMiss:3,safetyScore:94},{week:'W2',incidents:0,nearMiss:2,safetyScore:97},{week:'W3',incidents:1,nearMiss:4,safetyScore:92},{week:'W4',incidents:0,nearMiss:1,safetyScore:99}],
          submissions:[{id:'SF-001',title:'Safety Walkthrough Jan W1',status:'approved',submittedBy:'Ahmad Fauzi',date:'2025-01-07'},{id:'SF-002',title:'PPE Compliance Report',status:'pending',submittedBy:'Ahmad Fauzi',date:'2025-01-14'},{id:'SF-003',title:'Near Miss Investigation #3',status:'rejected',submittedBy:'Ahmad Fauzi',date:'2025-01-21'}]
        },
        'Feb 2025': { production:1050, defect:8, efficiency:91.2, downtime:30, oee:86.7, incidents:1,
          trend:{ production:7.1, defect:-33.3, efficiency:4.2, incidents:-50 },
          chart:[{week:'W1',incidents:0,nearMiss:2,safetyScore:97},{week:'W2',incidents:1,nearMiss:1,safetyScore:95},{week:'W3',incidents:0,nearMiss:3,safetyScore:96},{week:'W4',incidents:0,nearMiss:0,safetyScore:100}],
          submissions:[{id:'SF-004',title:'Safety Walkthrough Feb W1',status:'approved',submittedBy:'Ahmad Fauzi',date:'2025-02-04'},{id:'SF-005',title:'Emergency Drill Report',status:'approved',submittedBy:'Ahmad Fauzi',date:'2025-02-11'}]
        },
        'Mar 2025': { production:1120, defect:6, efficiency:93.4, downtime:22, oee:89.2, incidents:0,
          trend:{ production:6.7, defect:-25, efficiency:2.4, incidents:-100 },
          chart:[{week:'W1',incidents:0,nearMiss:1,safetyScore:99},{week:'W2',incidents:0,nearMiss:2,safetyScore:98},{week:'W3',incidents:0,nearMiss:0,safetyScore:100},{week:'W4',incidents:0,nearMiss:1,safetyScore:99}],
          submissions:[{id:'SF-006',title:'Monthly Safety Summary',status:'pending',submittedBy:'Ahmad Fauzi',date:'2025-03-31'}]
        },
      },
      'Plant B': {
        'Jan 2025': { production:870, defect:18, efficiency:79.3, downtime:92, oee:74.1, incidents:4,
          trend:{ production:-2.1, defect:12.5, efficiency:-3.2, incidents:33.3 },
          chart:[{week:'W1',incidents:2,nearMiss:5,safetyScore:81},{week:'W2',incidents:1,nearMiss:4,safetyScore:85},{week:'W3',incidents:1,nearMiss:6,safetyScore:79},{week:'W4',incidents:0,nearMiss:3,safetyScore:91}],
          submissions:[{id:'SF-007',title:'Incident Report Jan W1',status:'approved',submittedBy:'Reza Pratama',date:'2025-01-09'}]
        },
        'Feb 2025': { production:920, defect:14, efficiency:83.8, downtime:67, oee:78.9, incidents:2,
          trend:{ production:5.7, defect:-22.2, efficiency:5.7, incidents:-50 },
          chart:[{week:'W1',incidents:1,nearMiss:3,safetyScore:88},{week:'W2',incidents:0,nearMiss:2,safetyScore:93},{week:'W3',incidents:1,nearMiss:4,safetyScore:87},{week:'W4',incidents:0,nearMiss:1,safetyScore:96}],
          submissions:[]
        },
        'Mar 2025': { production:975, defect:10, efficiency:87.1, downtime:48, oee:83.4, incidents:1,
          trend:{ production:5.9, defect:-28.6, efficiency:4.0, incidents:-50 },
          chart:[{week:'W1',incidents:0,nearMiss:2,safetyScore:94},{week:'W2',incidents:1,nearMiss:2,safetyScore:91},{week:'W3',incidents:0,nearMiss:1,safetyScore:97},{week:'W4',incidents:0,nearMiss:1,safetyScore:96}],
          submissions:[]
        },
      },
      'Plant C': {
        'Jan 2025': { production:1100, defect:9, efficiency:91.0, downtime:35, oee:87.5, incidents:1,
          trend:{ production:4.8, defect:-10, efficiency:2.1, incidents:0 },
          chart:[{week:'W1',incidents:0,nearMiss:2,safetyScore:96},{week:'W2',incidents:1,nearMiss:1,safetyScore:93},{week:'W3',incidents:0,nearMiss:2,safetyScore:97},{week:'W4',incidents:0,nearMiss:0,safetyScore:100}],
          submissions:[]
        },
        'Feb 2025': { production:1180, defect:7, efficiency:94.2, downtime:25, oee:91.0, incidents:0,
          trend:{ production:7.3, defect:-22.2, efficiency:3.5, incidents:-100 },
          chart:[{week:'W1',incidents:0,nearMiss:1,safetyScore:98},{week:'W2',incidents:0,nearMiss:2,safetyScore:97},{week:'W3',incidents:0,nearMiss:0,safetyScore:100},{week:'W4',incidents:0,nearMiss:1,safetyScore:99}],
          submissions:[]
        },
        'Mar 2025': { production:1240, defect:5, efficiency:95.8, downtime:18, oee:93.1, incidents:0,
          trend:{ production:5.1, defect:-28.6, efficiency:1.7, incidents:0 },
          chart:[{week:'W1',incidents:0,nearMiss:0,safetyScore:100},{week:'W2',incidents:0,nearMiss:1,safetyScore:99},{week:'W3',incidents:0,nearMiss:0,safetyScore:100},{week:'W4',incidents:0,nearMiss:1,safetyScore:99}],
          submissions:[]
        },
      },
    },
    Quality: {
      'Plant A': {
        'Jan 2025': { production:1200, defect:23, efficiency:89.0, downtime:38, oee:85.4, incidents:0,
          trend:{ production:5.3, defect:-11.5, efficiency:2.4, incidents:0 },
          chart:[{week:'W1',passed:290,failed:8,rework:4},{week:'W2',passed:305,failed:5,rework:2},{week:'W3',passed:298,failed:6,rework:3},{week:'W4',passed:307,failed:4,rework:1}],
          submissions:[{id:'QC-001',title:'Monthly Quality Report',status:'approved',submittedBy:'Ahmad Fauzi',date:'2025-01-31'}]
        },
        'Feb 2025': { production:1320, defect:15, efficiency:93.5, downtime:22, oee:90.1, incidents:0,
          trend:{ production:10, defect:-34.8, efficiency:5.1, incidents:0 },
          chart:[{week:'W1',passed:325,failed:4,rework:2},{week:'W2',passed:331,failed:3,rework:1},{week:'W3',passed:329,failed:5,rework:2},{week:'W4',passed:335,failed:3,rework:0}],
          submissions:[]
        },
        'Mar 2025': { production:1400, defect:10, efficiency:95.8, downtime:15, oee:92.7, incidents:0,
          trend:{ production:6.1, defect:-33.3, efficiency:2.5, incidents:0 },
          chart:[{week:'W1',passed:344,failed:3,rework:1},{week:'W2',passed:350,failed:2,rework:1},{week:'W3',passed:352,failed:4,rework:2},{week:'W4',passed:354,failed:1,rework:0}],
          submissions:[]
        },
      },
      'Plant B': {
        'Jan 2025': { production:1100, defect:41, efficiency:82.1, downtime:55, oee:78.3, incidents:1,
          trend:{ production:1.8, defect:17.1, efficiency:-1.4, incidents:0 },
          chart:[{week:'W1',passed:260,failed:12,rework:8},{week:'W2',passed:271,failed:10,rework:6},{week:'W3',passed:275,failed:9,rework:5},{week:'W4',passed:294,failed:10,rework:6}],
          submissions:[]
        },
        'Feb 2025': { production:1180, defect:29, efficiency:86.7, downtime:41, oee:82.9, incidents:0,
          trend:{ production:7.3, defect:-29.3, efficiency:5.6, incidents:-100 },
          chart:[{week:'W1',passed:285,failed:8,rework:5},{week:'W2',passed:294,failed:7,rework:4},{week:'W3',passed:299,failed:7,rework:3},{week:'W4',passed:302,failed:7,rework:3}],
          submissions:[]
        },
        'Mar 2025': { production:1250, defect:20, efficiency:90.4, downtime:30, oee:86.8, incidents:0,
          trend:{ production:5.9, defect:-31, efficiency:4.3, incidents:0 },
          chart:[{week:'W1',passed:308,failed:5,rework:3},{week:'W2',passed:312,failed:5,rework:2},{week:'W3',passed:315,failed:5,rework:2},{week:'W4',passed:315,failed:5,rework:3}],
          submissions:[]
        },
      },
      'Plant C': {
        'Jan 2025': { production:1350, defect:18, efficiency:92.5, downtime:28, oee:89.3, incidents:0,
          trend:{ production:3.8, defect:-5.3, efficiency:1.8, incidents:0 },
          chart:[{week:'W1',passed:330,failed:5,rework:3},{week:'W2',passed:336,failed:4,rework:2},{week:'W3',passed:338,failed:5,rework:2},{week:'W4',passed:346,failed:4,rework:1}],
          submissions:[]
        },
        'Feb 2025': { production:1420, defect:12, efficiency:95.1, downtime:20, oee:92.4, incidents:0,
          trend:{ production:5.2, defect:-33.3, efficiency:2.8, incidents:0 },
          chart:[{week:'W1',passed:350,failed:3,rework:1},{week:'W2',passed:355,failed:3,rework:2},{week:'W3',passed:356,failed:3,rework:1},{week:'W4',passed:359,failed:3,rework:1}],
          submissions:[]
        },
        'Mar 2025': { production:1490, defect:8, efficiency:96.8, downtime:14, oee:94.5, incidents:0,
          trend:{ production:4.9, defect:-33.3, efficiency:1.8, incidents:0 },
          chart:[{week:'W1',passed:370,failed:2,rework:1},{week:'W2',passed:373,failed:2,rework:1},{week:'W3',passed:373,failed:2,rework:0},{week:'W4',passed:374,failed:2,rework:1}],
          submissions:[]
        },
      },
    },
    Delivery: {
      'Plant A': {
        'Jan 2025': { production:1150, defect:19, efficiency:91.8, downtime:28, oee:88.2, incidents:0,
          trend:{ production:4.1, defect:-17.4, efficiency:3.0, incidents:0 },
          chart:[{week:'W1',onTime:280,late:8,early:12},{week:'W2',onTime:291,late:5,early:9},{week:'W3',onTime:285,late:7,early:8},{week:'W4',onTime:294,late:4,early:12}],
          submissions:[]
        },
        'Feb 2025': { production:1240, defect:11, efficiency:94.2, downtime:18, oee:91.5, incidents:0,
          trend:{ production:7.8, defect:-42.1, efficiency:2.6, incidents:0 },
          chart:[{week:'W1',onTime:303,late:4,early:13},{week:'W2',onTime:309,late:3,early:8},{week:'W3',onTime:311,late:2,early:7},{week:'W4',onTime:317,late:2,early:11}],
          submissions:[]
        },
        'Mar 2025': { production:1310, defect:8, efficiency:96.0, downtime:12, oee:93.5, incidents:0,
          trend:{ production:5.6, defect:-27.3, efficiency:1.9, incidents:0 },
          chart:[{week:'W1',onTime:323,late:2,early:10},{week:'W2',onTime:327,late:1,early:9},{week:'W3',onTime:328,late:2,early:8},{week:'W4',onTime:332,late:3,early:7}],
          submissions:[]
        },
      },
      'Plant B': {
        'Jan 2025': { production:990, defect:32, efficiency:77.4, downtime:105, oee:72.8, incidents:2,
          trend:{ production:-4.3, defect:18.5, efficiency:-4.8, incidents:100 },
          chart:[{week:'W1',onTime:231,late:22,early:4},{week:'W2',onTime:245,late:19,early:3},{week:'W3',onTime:252,late:16,early:5},{week:'W4',onTime:262,late:14,early:4}],
          submissions:[]
        },
        'Feb 2025': { production:1060, defect:22, efficiency:83.1, downtime:74, oee:79.4, incidents:1,
          trend:{ production:7.1, defect:-31.3, efficiency:7.4, incidents:-50 },
          chart:[{week:'W1',onTime:260,late:12,early:5},{week:'W2',onTime:268,late:9,early:6},{week:'W3',onTime:272,late:8,early:7},{week:'W4',onTime:260,late:13,early:7}],
          submissions:[]
        },
        'Mar 2025': { production:1120, defect:15, efficiency:87.5, downtime:55, oee:83.9, incidents:0,
          trend:{ production:5.7, defect:-31.8, efficiency:5.3, incidents:-100 },
          chart:[{week:'W1',onTime:275,late:7,early:8},{week:'W2',onTime:280,late:6,early:7},{week:'W3',onTime:282,late:5,early:8},{week:'W4',onTime:283,late:7,early:8}],
          submissions:[]
        },
      },
      'Plant C': {
        'Jan 2025': { production:1280, defect:15, efficiency:93.4, downtime:25, oee:90.1, incidents:0,
          trend:{ production:5.0, defect:-6.3, efficiency:2.3, incidents:0 },
          chart:[{week:'W1',onTime:315,late:4,early:11},{week:'W2',onTime:320,late:3,early:9},{week:'W3',onTime:322,late:4,early:10},{week:'W4',onTime:323,late:4,early:8}],
          submissions:[]
        },
        'Feb 2025': { production:1350, defect:10, efficiency:95.9, downtime:16, oee:93.2, incidents:0,
          trend:{ production:5.5, defect:-33.3, efficiency:2.7, incidents:0 },
          chart:[{week:'W1',onTime:333,late:2,early:10},{week:'W2',onTime:337,late:2,early:9},{week:'W3',onTime:338,late:2,early:8},{week:'W4',onTime:342,late:4,early:7}],
          submissions:[]
        },
        'Mar 2025': { production:1410, defect:7, efficiency:97.2, downtime:10, oee:95.0, incidents:0,
          trend:{ production:4.4, defect:-30, efficiency:1.4, incidents:0 },
          chart:[{week:'W1',onTime:349,late:1,early:9},{week:'W2',onTime:352,late:1,early:8},{week:'W3',onTime:352,late:2,early:7},{week:'W4',onTime:357,late:2,early:7}],
          submissions:[]
        },
      },
    },
    Productivity: {
      'Plant A': {
        'Jan 2025': { production:1300, defect:20, efficiency:88.5, downtime:52, oee:84.1, incidents:1,
          trend:{ production:6.1, defect:-9.1, efficiency:2.8, incidents:-50 },
          chart:[{week:'W1',target:320,actual:308,variance:-12},{week:'W2',target:320,actual:325,variance:5},{week:'W3',target:330,actual:322,variance:-8},{week:'W4',target:330,actual:345,variance:15}],
          submissions:[]
        },
        'Feb 2025': { production:1450, defect:14, efficiency:92.8, downtime:33, oee:89.6, incidents:0,
          trend:{ production:11.5, defect:-30, efficiency:4.9, incidents:-100 },
          chart:[{week:'W1',target:350,actual:358,variance:8},{week:'W2',target:360,actual:364,variance:4},{week:'W3',target:360,actual:371,variance:11},{week:'W4',target:380,actual:357,variance:-23}],
          submissions:[]
        },
        'Mar 2025': { production:1530, defect:10, efficiency:95.2, downtime:22, oee:92.3, incidents:0,
          trend:{ production:5.5, defect:-28.6, efficiency:2.6, incidents:0 },
          chart:[{week:'W1',target:380,actual:382,variance:2},{week:'W2',target:385,actual:389,variance:4},{week:'W3',target:385,actual:381,variance:-4},{week:'W4',target:380,actual:378,variance:-2}],
          submissions:[]
        },
      },
      'Plant B': {
        'Jan 2025': { production:1050, defect:37, efficiency:80.2, downtime:88, oee:76.5, incidents:3,
          trend:{ production:0.9, defect:15.6, efficiency:-2.1, incidents:50 },
          chart:[{week:'W1',target:280,actual:255,variance:-25},{week:'W2',target:280,actual:261,variance:-19},{week:'W3',target:270,actual:268,variance:-2},{week:'W4',target:270,actual:266,variance:-4}],
          submissions:[]
        },
        'Feb 2025': { production:1130, defect:26, efficiency:85.6, downtime:61, oee:81.8, incidents:1,
          trend:{ production:7.6, defect:-29.7, efficiency:6.7, incidents:-66.7 },
          chart:[{week:'W1',target:280,actual:272,variance:-8},{week:'W2',target:285,actual:283,variance:-2},{week:'W3',target:285,actual:289,variance:4},{week:'W4',target:290,actual:286,variance:-4}],
          submissions:[]
        },
        'Mar 2025': { production:1200, defect:18, efficiency:90.1, downtime:44, oee:86.4, incidents:0,
          trend:{ production:6.2, defect:-30.8, efficiency:5.3, incidents:-100 },
          chart:[{week:'W1',target:295,actual:296,variance:1},{week:'W2',target:300,actual:303,variance:3},{week:'W3',target:300,actual:299,variance:-1},{week:'W4',target:305,actual:302,variance:-3}],
          submissions:[]
        },
      },
      'Plant C': {
        'Jan 2025': { production:1420, defect:16, efficiency:93.8, downtime:32, oee:90.5, incidents:0,
          trend:{ production:5.2, defect:-5.9, efficiency:2.0, incidents:0 },
          chart:[{week:'W1',target:350,actual:351,variance:1},{week:'W2',target:355,actual:358,variance:3},{week:'W3',target:355,actual:353,variance:-2},{week:'W4',target:360,actual:358,variance:-2}],
          submissions:[]
        },
        'Feb 2025': { production:1500, defect:11, efficiency:96.0, downtime:22, oee:93.3, incidents:0,
          trend:{ production:5.6, defect:-31.3, efficiency:2.3, incidents:0 },
          chart:[{week:'W1',target:370,actual:373,variance:3},{week:'W2',target:375,actual:378,variance:3},{week:'W3',target:375,actual:373,variance:-2},{week:'W4',target:380,actual:376,variance:-4}],
          submissions:[]
        },
        'Mar 2025': { production:1570, defect:8, efficiency:97.4, downtime:15, oee:95.1, incidents:0,
          trend:{ production:4.7, defect:-27.3, efficiency:1.5, incidents:0 },
          chart:[{week:'W1',target:390,actual:392,variance:2},{week:'W2',target:390,actual:394,variance:4},{week:'W3',target:395,actual:390,variance:-5},{week:'W4',target:395,actual:394,variance:-1}],
          submissions:[]
        },
      },
    },
  },

  // Master filter options
  plants:  ['Plant A', 'Plant B', 'Plant C'],
  periods: ['Jan 2025', 'Feb 2025', 'Mar 2025'],
  shifts:  ['All Shifts', 'Shift 1 (06-14)', 'Shift 2 (14-22)', 'Shift 3 (22-06)'],
  lines:   { 'Plant A': ['All Lines','Line 1','Line 2','Line 3'], 'Plant B': ['All Lines','Line 1','Line 2'], 'Plant C': ['All Lines','Line 1','Line 2','Line 3','Line 4'] },
};

// ─────────────────────────────────────────────────────────
// DB Interface — sama persis untuk mock & real
// ─────────────────────────────────────────────────────────
const db = {
  // Cari user by username
  async findUserByUsername(username) {
    if (process.env.DATA_MODE === 'real') {
      const pool = await getPool();
      const res  = await pool.request()
        .input('username', sql.VarChar, username)
        .query('SELECT * FROM Users WHERE Username = @username AND Active = 1');
      return res.recordset[0] || null;
    }
    return MOCK.users.find(u => u.username === username && u.active) || null;
  },

  // Cari user by ID
  async findUserById(id) {
    if (process.env.DATA_MODE === 'real') {
      const pool = await getPool();
      const res  = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM Users WHERE Id = @id AND Active = 1');
      return res.recordset[0] || null;
    }
    return MOCK.users.find(u => u.id === id) || null;
  },

  // Ambil semua user (super_admin only)
  async getAllUsers() {
    if (process.env.DATA_MODE === 'real') {
      const pool = await getPool();
      const res  = await pool.request()
        .query('SELECT Id,Username,Name,Role,BuAccess,Department,Active FROM Users');
      return res.recordset;
    }
    return MOCK.users.map(({ password: _, ...u }) => u);
  },

  // Ambil metric data
  async getMetrics(tab, plant, period) {
    if (process.env.DATA_MODE === 'real') {
      const pool = await getPool();
      const res  = await pool.request()
        .input('tab',    sql.VarChar, tab)
        .input('plant',  sql.VarChar, plant)
        .input('period', sql.VarChar, period)
        .query(`SELECT * FROM Metrics WHERE Tab=@tab AND Plant=@plant AND Period=@period`);
      return res.recordset[0] || null;
    }
    return MOCK.metrics[tab]?.[plant]?.[period] || null;
  },

  // Ambil daftar filter options
  async getFilterOptions(plant = null) {
    if (process.env.DATA_MODE === 'real') {
      const pool = await getPool();
      const p    = await pool.request().query('SELECT DISTINCT Plant FROM Metrics ORDER BY Plant');
      const pr   = await pool.request().query('SELECT DISTINCT Period FROM Metrics ORDER BY Period');
      return {
        plants:  p.recordset.map(r => r.Plant),
        periods: pr.recordset.map(r => r.Period),
        shifts:  MOCK.shifts,
        lines:   plant ? MOCK.lines[plant] || MOCK.lines['Plant A'] : MOCK.lines,
      };
    }
    return {
      plants:  MOCK.plants,
      periods: MOCK.periods,
      shifts:  MOCK.shifts,
      lines:   plant ? (MOCK.lines[plant] || []) : MOCK.lines,
    };
  },

  // Ambil submissions (pic_staff / approver)
  async getSubmissions(plant, tab, status = null) {
    const data = MOCK.metrics[tab]?.[plant];
    if (!data) return [];
    let subs = [];
    Object.values(data).forEach(d => { if (d.submissions) subs = subs.concat(d.submissions); });
    if (status) subs = subs.filter(s => s.status === status);
    return subs;
  },

  // Update submission status (approver)
  async updateSubmissionStatus(id, status, approverId) {
    // Di real mode: UPDATE Submissions SET Status=@status, ApprovedBy=@approverId WHERE Id=@id
    // Mock: selalu berhasil
    return { success: true, id, status, approvedBy: approverId, updatedAt: new Date().toISOString() };
  },
};

module.exports = { db, MOCK };
