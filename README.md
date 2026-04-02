# 🏭 Denso Production Dashboard v2.0
**PKL Project — PT. Denso Indonesia | PED Division**

Full-stack dashboard dengan React + Node.js + SQL Server (atau mock mode).

---

## 📁 Struktur Project
```
denso-dashboard/
├── backend/                   ← Node.js + Express API
│   ├── data/db.js             ← Database layer (mock + real SQL Server)
│   ├── middleware/auth.js     ← JWT auth + permission guard
│   ├── routes/
│   │   ├── auth.js            ← POST /login, GET /me, POST /logout
│   │   └── dashboard.js       ← GET /metrics, /filters, /submissions
│   ├── server.js              ← Entry point backend
│   ├── .env.example           ← Copy ke .env dan isi
│   └── package.json
│
└── frontend/                  ← React + Vite
    └── src/
        ├── context/AuthContext.jsx    ← Global auth state (React Context)
        ├── hooks/useDashboard.js      ← Custom hook API calls
        ├── components/
        │   ├── MetricCard.jsx         ← Reusable metric card + sparkline
        │   └── ui/index.jsx           ← LoadingSpinner, ErrorCard, Badge, dll
        ├── pages/
        │   ├── LoginPage.jsx          ← Halaman login + demo accounts
        │   └── Dashboard.jsx          ← Dashboard utama + URL state
        ├── App.jsx                    ← Router + auth guard
        └── main.jsx                   ← Entry point React
```

---

## 🚀 Cara Jalankan

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # Edit .env sesuai kebutuhan
npm run dev               # Jalan di http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # Jalan di http://localhost:5173
```

---

## 🔐 Demo Accounts
Semua password: **password123**

| Username        | Role          | Plant Access     |
|----------------|---------------|------------------|
| `superadmin`    | Super Admin   | Semua plant      |
| `admin_plant_a` | Administrator | Plant A          |
| `approver_mgr`  | Approver      | Plant A, Plant B |
| `pic_safety`    | PIC Staff     | Plant A          |

---

## 🧠 Konsep React yang Dipelajari v2

| Konsep | Di mana |
|---|---|
| `useSearchParams` | Dashboard.jsx — URL state |
| `useContext` | AuthContext + useAuth hook |
| `Custom Hook` | useDashboard.js |
| Loading/Error state | SkeletonCard, ErrorCard |
| Route protection | App.jsx (ProtectedRoute) |
| Permission gate | middleware/auth.js + hasPermission() |
| Fetch + AbortController | useDashboard.js |
| Floating mobile nav | Dashboard.jsx + app.css |

---

## 🔧 Mode Database

Edit `backend/.env`:
```env
DATA_MODE=mock    # Pakai dummy data (default)
DATA_MODE=real    # Pakai SQL Server beneran
```

Kalau `DATA_MODE=real`, jalankan SQL ini dulu di SQL Server:
```sql
CREATE TABLE Users (
  Id INT PRIMARY KEY IDENTITY,
  Username VARCHAR(50) UNIQUE NOT NULL,
  Name NVARCHAR(100),
  Password VARCHAR(100),
  Role VARCHAR(20),
  BuAccess NVARCHAR(200),
  Department VARCHAR(50),
  Active BIT DEFAULT 1
);
```
