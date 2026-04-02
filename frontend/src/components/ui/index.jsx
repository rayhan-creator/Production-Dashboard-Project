// components/ui/index.jsx — Semua reusable UI components

export function LoadingSpinner({ size = 'md', text = 'Memuat data...' }) {
  const px = { sm:20, md:32, lg:48 }[size] || 32;
  return (
    <div className="loading-state">
      <div className="spinner" style={{ width:px, height:px }}>
        <svg viewBox="0 0 50 50" style={{ animation:'spin 1s linear infinite', width:'100%', height:'100%' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="var(--accent-green)"
            strokeWidth="4" strokeLinecap="round" strokeDasharray="80 40"/>
        </svg>
      </div>
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
}

export function SkeletonCard({ count = 6 }) {
  return (
    <div className="metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay:`${i * 80}ms` }}>
          <div className="skeleton-line short"/>
          <div className="skeleton-line tall"/>
          <div className="skeleton-line medium"/>
        </div>
      ))}
    </div>
  );
}

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="error-card">
      <div className="error-icon">⚠️</div>
      <div className="error-body">
        <p className="error-title">Gagal Memuat Data</p>
        <p className="error-message">{message}</p>
      </div>
      {onRetry && <button className="btn-retry" onClick={onRetry}>↺ Coba Lagi</button>}
    </div>
  );
}

export function Badge({ label, color, bg, icon, size = 'sm' }) {
  return (
    <span className={`badge badge-${size}`} style={{ color, background:bg, borderColor:color+'44' }}>
      {icon && <span className="badge-icon">{icon}</span>}
      {label}
    </span>
  );
}

const STATUS_CFG = {
  approved: { label:'Approved', color:'#00C9A7', bg:'rgba(0,201,167,0.12)',  icon:'✓' },
  pending:  { label:'Pending',  color:'#FFD93D', bg:'rgba(255,217,61,0.12)', icon:'⏳' },
  rejected: { label:'Rejected', color:'#FF6B6B', bg:'rgba(255,107,107,0.12)',icon:'✕' },
};
export function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return <Badge {...cfg}/>;
}

export function SubmissionCard({ submission, canApprove, onApprove, onReject }) {
  const { id, title, status, submittedBy, date } = submission;
  return (
    <div className="submission-card">
      <div className="submission-header">
        <div>
          <span className="submission-id">{id}</span>
          <p className="submission-title">{title}</p>
        </div>
        <StatusBadge status={status}/>
      </div>
      <div className="submission-footer">
        <span className="submission-meta">👤 {submittedBy} · 📅 {date}</span>
        {canApprove && status === 'pending' && (
          <div className="submission-actions">
            <button className="btn-approve" onClick={() => onApprove(id)}>Approve</button>
            <button className="btn-reject"  onClick={() => onReject(id)}>Reject</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon='📭', title='Tidak ada data', desc }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <p className="empty-title">{title}</p>
      {desc && <p className="empty-desc">{desc}</p>}
    </div>
  );
}

export function AccessDenied({ message='Anda tidak memiliki akses ke halaman ini.' }) {
  return (
    <div className="access-denied">
      <span style={{ fontSize:36 }}>🔒</span>
      <p className="access-denied-title">Akses Ditolak</p>
      <p className="access-denied-msg">{message}</p>
    </div>
  );
}
