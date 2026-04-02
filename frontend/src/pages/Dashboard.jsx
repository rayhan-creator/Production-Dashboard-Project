// pages/Dashboard.jsx — Full dashboard dengan Export Excel + Dark/Light toggle
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';

import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import { useExport } from '../hooks/useExport.js';
import MetricCard from '../components/MetricCard.jsx';
import {
  EmptyState, ErrorCard, SkeletonCard,
  SubmissionCard
} from '../components/ui/index.jsx';

const TABS = [
  { id:'Safety',       icon:'🦺', color:'#FF8C42' },
  { id:'Quality',      icon:'✅', color:'#00C9A7' },
  { id:'Delivery',     icon:'🚚', color:'#6C63FF' },
  { id:'Productivity', icon:'📊', color:'#FFD93D' },
];

const CHART_CFG = {
  Safety:      { bars:[{k:'incidents',c:'#FF6B6B',n:'Incidents'},{k:'nearMiss',c:'#FFD93D',n:'Near Miss'}], line:{k:'safetyScore',c:'#00C9A7',n:'Safety Score'}, title:'Weekly Safety Overview' },
  Quality:     { bars:[{k:'passed',c:'#00C9A7',n:'Passed'},{k:'failed',c:'#FF6B6B',n:'Failed'},{k:'rework',c:'#FFD93D',n:'Rework'}], title:'Weekly Quality Inspection' },
  Delivery:    { bars:[{k:'onTime',c:'#00C9A7',n:'On Time'},{k:'late',c:'#FF6B6B',n:'Late'},{k:'early',c:'#6C63FF',n:'Early'}], title:'Weekly Delivery Performance' },
  Productivity:{ bars:[{k:'target',c:'#6C63FF',n:'Target'},{k:'actual',c:'#00C9A7',n:'Actual'}], title:'Target vs Actual' },
};

const PIE_DATA   = [{name:'Availability',value:92},{name:'Performance',value:88},{name:'Quality',value:96},{name:'Losses',value:12}];
const PIE_COLORS = ['#00C9A7','#6C63FF','#4ECDC4','#FF6B6B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
      <p style={{ color:'var(--text-secondary)', fontSize:11, marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontSize:12, margin:'2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab')    || 'Safety';
  const plant     = searchParams.get('plant')  || '';
  const period    = searchParams.get('period') || '';
  const shift     = searchParams.get('shift')  || 'All Shifts';
  const line      = searchParams.get('line')   || 'All Lines';

  const { user, hasPermission, canAccessPlant, logout, roleConfig } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { exportToExcel, exporting } = useExport();

  const {
    filterOptions, metrics, submissions,
    loadingFilters, loadingMetrics,
    errorMetrics, refetchMetrics, refetchSubmissions,
  } = useDashboard({ tab:activeTab, plant, period, shift, line });

  const [showSubmissions, setShowSubmissions] = useState(false);

  // Set default filter saat options pertama load
  useEffect(() => {
    if (!loadingFilters && filterOptions.plants.length > 0) {
      const updates = {};
      if (!plant  || !filterOptions.plants.includes(plant))   updates.plant  = filterOptions.plants[0];
      if (!period || !filterOptions.periods.includes(period)) updates.period = filterOptions.periods[0];
      if (Object.keys(updates).length) {
        setSearchParams(p => { Object.entries(updates).forEach(([k,v]) => p.set(k,v)); return p; }, { replace:true });
      }
    }
  }, [loadingFilters, filterOptions]);

  const setParam = (key, val) =>
    setSearchParams(p => { p.set(key, val); return p; }, { replace:true });

  const handleTabChange = (tabId) => {
    setSearchParams(p => { p.set('tab', tabId); p.delete('shift'); p.delete('line'); return p; }, { replace:true });
  };

  const handlePlantChange = (p) => {
    setSearchParams(sp => { sp.set('plant', p); sp.delete('line'); return sp; }, { replace:true });
  };

  const handleApprove = async (id) => { alert(`Approved: ${id}`); refetchSubmissions(); };
  const handleReject  = async (id) => { alert(`Rejected: ${id}`);  refetchSubmissions(); };

  const tabCfg  = TABS.find(t => t.id === activeTab) || TABS[0];
  const chartCfg = CHART_CFG[activeTab];

  const metricList = metrics ? [
    { label:'Production', mkey:'production', value:metrics.production, trend:metrics.trend?.production },
    { label:'Defect',     mkey:'defect',     value:metrics.defect,     trend:metrics.trend?.defect     },
    { label:'Efficiency', mkey:'efficiency', value:metrics.efficiency, trend:metrics.trend?.efficiency },
    { label:'Downtime',   mkey:'downtime',   value:metrics.downtime    },
    { label:'OEE',        mkey:'oee',        value:metrics.oee         },
    { label:'Incidents',  mkey:'incidents',  value:metrics.incidents,  trend:metrics.trend?.incidents  },
  ] : [];

  const now = new Date().toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

  return (
    <div className="app-wrapper">
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">🏭</div>
          <div>
            <div className="header-title">Production <span>Dashboard</span></div>
            <div className="header-subtitle">PT. DENSO INDONESIA — PED Division</div>
          </div>
        </div>
        <div className="header-right">
          <div className="status-badge"><div className="status-dot"/>LIVE</div>
          <div className="last-updated">{now}</div>

          {/* Dark/Light toggle */}
          <button className="btn-theme-toggle" onClick={toggleTheme} title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* User info */}
          <div className="header-user">
            <div className="user-avatar" style={{ background:roleConfig?.bg, color:roleConfig?.color }}>
              {user?.avatar || user?.name?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role" style={{ color:roleConfig?.color }}>
                {roleConfig?.icon} {roleConfig?.label}
              </span>
            </div>
            <button className="btn-logout" onClick={logout} title="Logout">⏻</button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* ── SIDEBAR ── */}
        <nav className="sidebar">
          <div className="sidebar-label">Navigation</div>
          {TABS.map(t => (
            <button key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}
              style={activeTab === t.id ? { '--tab-color':t.color } : {}}>
              <span className="tab-icon">{t.icon}</span>{t.id}
            </button>
          ))}
          <div className="sidebar-divider"/>
          {hasPermission('view:submissions') && (
            <button className={`tab-btn ${showSubmissions ? 'active' : ''}`}
              onClick={() => { setShowSubmissions(s => !s); if (!showSubmissions) refetchSubmissions(); }}
              style={showSubmissions ? { '--tab-color':'#FFD93D' } : {}}>
              <span className="tab-icon">📝</span>Submissions
            </button>
          )}
          <div className="sidebar-divider"/>
          <div className="sidebar-info">
            <div className="sidebar-info-title">BU Access</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
              {user?.bu_access?.map(bu => <span key={bu} className="bu-tag">{bu}</span>)}
            </div>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="main-content">
          {/* ── FILTER BAR ── */}
          <div className="filter-bar">
            <span className="filter-label">Filter:</span>

            <select className="filter-select" value={plant}
              onChange={e => handlePlantChange(e.target.value)} disabled={loadingFilters}>
              {filterOptions.plants.map(p => (
                <option key={p} value={p} disabled={!canAccessPlant(p)}>
                  {p}{!canAccessPlant(p) ? ' 🔒' : ''}
                </option>
              ))}
            </select>

            <select className="filter-select" value={period}
              onChange={e => setParam('period', e.target.value)} disabled={loadingFilters}>
              {filterOptions.periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select className="filter-select" value={shift}
              onChange={e => setParam('shift', e.target.value)} disabled={loadingFilters}>
              {filterOptions.shifts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {filterOptions.lines?.length > 1 && (
              <select className="filter-select" value={line}
                onChange={e => setParam('line', e.target.value)} disabled={loadingFilters}>
                {filterOptions.lines.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}

            <div className="filter-spacer"/>

            {/* Export Excel button */}
            <button
              className={`btn-export ${exporting ? 'loading' : ''}`}
              onClick={() => exportToExcel({ metrics, tab:activeTab, plant, period, shift, line })}
              disabled={!metrics || exporting}
              title="Export ke Excel">
              {exporting ? '⏳' : '⬇'} {exporting ? 'Exporting...' : 'Excel'}
            </button>

            <button className="btn-refresh" onClick={refetchMetrics} disabled={loadingMetrics} title="Refresh">
              {loadingMetrics ? '⏳' : '↺'}
            </button>

            <div className="active-tab-badge" style={{ '--badge-color':tabCfg.color }}>
              {tabCfg.icon} {activeTab} · {plant} · {period}
              {shift !== 'All Shifts' && ` · ${shift.split(' ')[1]}`}
              {line  !== 'All Lines'  && ` · ${line}`}
            </div>
          </div>

          {/* ── SCROLL AREA ── */}
          <div className="scroll-area">

            {/* Submissions panel */}
            {showSubmissions && (
              <section style={{ marginBottom:28 }}>
                <div className="section-title">
                  <span className="section-dot" style={{ background:'#FFD93D' }}/>
                  Submissions — {activeTab} / {plant}
                </div>
                {submissions.length === 0
                  ? <EmptyState icon="📭" title="Belum ada submission"/>
                  : <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {submissions.map(s => (
                        <SubmissionCard key={s.id} submission={s}
                          canApprove={hasPermission('approve:submissions')}
                          onApprove={handleApprove} onReject={handleReject}/>
                      ))}
                    </div>
                }
              </section>
            )}

            {/* Metrics */}
            <section className="metrics-section">
              <div className="section-title">
                <span className="section-dot" style={{ background:tabCfg.color }}/>
                Key Metrics — {activeTab}
                {(shift !== 'All Shifts' || line !== 'All Lines') && (
                  <span className="filter-active-indicator">
                    {shift !== 'All Shifts' && shift.split(' ')[1]}
                    {line  !== 'All Lines'  && ` · ${line}`}
                  </span>
                )}
              </div>

              {loadingMetrics && <SkeletonCard count={6}/>}
              {errorMetrics && !loadingMetrics && <ErrorCard message={errorMetrics} onRetry={refetchMetrics}/>}
              {!loadingMetrics && !errorMetrics && metrics && (
                <div className="metrics-grid">
                  {metricList.map((m, i) => (
                    <MetricCard key={m.mkey} {...m} index={i} sparkData={metrics.chart}/>
                  ))}
                </div>
              )}
              {!loadingMetrics && !errorMetrics && !metrics && (
                <EmptyState icon="📭" title="Data tidak tersedia"
                  desc={`Tidak ada data untuk: ${activeTab} / ${plant} / ${period}`}/>
              )}
            </section>

            {/* Charts */}
            {metrics && !loadingMetrics && (
              <section className="charts-section">
                <div className="section-title"><span className="section-dot"/>Analytics</div>
                <div className="charts-grid">

                  <div className="chart-card">
                    <div className="chart-title">{chartCfg.title}</div>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={metrics.chart} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
                        <XAxis dataKey="week" tick={{ fill:'var(--text-secondary)', fontSize:11 }} axisLine={false} tickLine={false}/>
                        <YAxis tick={{ fill:'var(--text-secondary)', fontSize:11 }} axisLine={false} tickLine={false}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend wrapperStyle={{ color:'var(--text-secondary)', fontSize:11 }}/>
                        {chartCfg.bars.map(b => (
                          <Bar key={b.k} dataKey={b.k} fill={b.c} name={b.n} radius={[4,4,0,0]}/>
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {chartCfg.line && (
                    <div className="chart-card">
                      <div className="chart-title">Weekly {chartCfg.line.n} Trend</div>
                      <ResponsiveContainer width="100%" height={210}>
                        <LineChart data={metrics.chart} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)"/>
                          <XAxis dataKey="week" tick={{ fill:'var(--text-secondary)', fontSize:11 }} axisLine={false} tickLine={false}/>
                          <YAxis domain={[70,105]} tick={{ fill:'var(--text-secondary)', fontSize:11 }} axisLine={false} tickLine={false}/>
                          <Tooltip content={<CustomTooltip/>}/>
                          <Line type="monotone" dataKey={chartCfg.line.k} stroke={chartCfg.line.c}
                            strokeWidth={2.5} dot={{ fill:chartCfg.line.c, r:4 }} activeDot={{ r:6 }} name={chartCfg.line.n}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="chart-card">
                    <div className="chart-title">OEE Breakdown — {metrics.oee}%</div>
                    <div className="pie-wrapper">
                      <ResponsiveContainer width="100%" height={210}>
                        <PieChart>
                          <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={82}
                            paddingAngle={3} dataKey="value">
                            {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]}/>)}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-primary)' }}
                            formatter={v => [`${v}%`]}/>
                          <Legend wrapperStyle={{ color:'var(--text-secondary)', fontSize:11 }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      {/* ── MOBILE FLOATING BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-pill">
          {TABS.map(t => (
            <button key={t.id}
              className={`mobile-nav-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}
              style={activeTab === t.id ? { '--tab-color':t.color } : {}}>
              <span className="mobile-nav-icon">{t.icon}</span>
              <span className="mobile-nav-label">{t.id}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
