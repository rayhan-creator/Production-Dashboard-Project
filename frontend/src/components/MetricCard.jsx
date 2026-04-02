// components/MetricCard.jsx
import { useEffect, useState } from 'react';

const METRIC_CONFIG = {
  production: { icon:'⚙️', accent:'#00C9A7', unit:'units', desc:'Total produksi unit' },
  defect:     { icon:'⚠️', accent:'#FF6B6B', unit:'pcs',   desc:'Total unit cacat' },
  efficiency: { icon:'📈', accent:'#4ECDC4', unit:'%',     desc:'Efisiensi lini produksi', isPercent:true },
  downtime:   { icon:'🕐', accent:'#FFD93D', unit:'min',   desc:'Total downtime mesin' },
  oee:        { icon:'🏭', accent:'#6C63FF', unit:'%',     desc:'Overall Equipment Effectiveness', isPercent:true },
  incidents:  { icon:'🦺', accent:'#FF8C42', unit:'case',  desc:'Insiden keselamatan kerja' },
};

function Sparkline({ data = [], color = '#00C9A7' }) {
  if (!data || data.length < 2) return null;
  const w = 72, h = 26;
  const vals = data.map(d => {
    if (typeof d === 'number') return d;
    const nums = Object.values(d).filter(v => typeof v === 'number');
    return nums.length ? nums[0] : 0;
  });
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = pts.split(' ').pop().split(',');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color}/>
    </svg>
  );
}

const MetricCard = ({ label, value, metricKey, trend, sparkData, index = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible,    setIsVisible]    = useState(false);
  const cfg = METRIC_CONFIG[metricKey] || { icon:'📊', accent:'#888', unit:'', desc:label };

  useEffect(() => {
    const delay = index * 60;
    const vt = setTimeout(() => setIsVisible(true), delay + 30);
    const steps = 45, dur = 750;
    const inc = value / steps;
    let cur = 0, step = 0;
    const timer = setInterval(() => {
      step++;
      cur = Math.min(cur + inc, value);
      setDisplayValue(Math.round(cur * 10) / 10);
      if (step >= steps) clearInterval(timer);
    }, dur / steps);
    return () => { clearTimeout(vt); clearInterval(timer); };
  }, [value, index]);

  // Untuk metric "buruk kalau naik" (defect/downtime/incidents): warna terbalik
  const isNegativeMetric = ['defect', 'downtime', 'incidents'].includes(metricKey);
  const trendPos   = trend >= 0;
  const trendGood  = isNegativeMetric ? !trendPos : trendPos;
  const trendColor = trendGood ? '#00C9A7' : '#FF6B6B';
  const trendIcon  = trendPos ? '▲' : '▼';

  const fmtVal = cfg.isPercent
    ? displayValue.toFixed(1)
    : Math.round(displayValue).toLocaleString('id-ID');

  // OEE: warna nilai berdasarkan threshold
  const valueColor = metricKey === 'oee'
    ? value >= 85 ? '#00C9A7' : value >= 70 ? '#FFD93D' : '#FF6B6B'
    : 'var(--text-primary)';

  return (
    <div className="metric-card" style={{
      opacity:    isVisible ? 1 : 0,
      transform:  isVisible ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity .4s ease ${index * 60}ms, transform .4s ease ${index * 60}ms`,
      '--accent':  cfg.accent,
    }}>
      <div className="card-accent-bar"/>
      <div className="card-bg-circle"/>
      <div className="card-inner">
        <div className="card-header">
          <span className="card-icon">{cfg.icon}</span>
          <span className="card-label">{label}</span>
          {sparkData && <span className="card-sparkline"><Sparkline data={sparkData} color={cfg.accent}/></span>}
        </div>
        <div className="card-value" style={{ color: valueColor }}>
          {fmtVal}<span className="card-unit">{cfg.unit}</span>
        </div>
        <div className="card-footer">
          <span className="card-desc">{cfg.desc}</span>
          {trend !== undefined && (
            <span className="card-trend" style={{ color: trendColor }}>
              {trendIcon} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
