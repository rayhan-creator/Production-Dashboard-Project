// hooks/useDashboard.js — Query langsung ke Supabase, no backend
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, FILTER_OPTIONS } from '../lib/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';

export function useDashboard({ tab, plant, period, shift, line }) {
  const { user, canAccessPlant } = useAuth();

  const [metrics,       setMetrics]       = useState(null);
  const [submissions,   setSubmissions]   = useState([]);
  const [filterOptions, setFilterOptions] = useState({ plants:[], periods:[], shifts:[], lines:[] });
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [errorMetrics,   setErrorMetrics]   = useState(null);

  const abortRef = useRef(null);

  // ── Build filter options sesuai BU access user ──
  useEffect(() => {
    if (!user) return;
    const allowedPlants = user.role === 'super_admin'
      ? FILTER_OPTIONS.plants
      : FILTER_OPTIONS.plants.filter(p => user.bu_access?.includes(p));

    setFilterOptions({
      plants:  allowedPlants,
      periods: FILTER_OPTIONS.periods,
      shifts:  FILTER_OPTIONS.shifts,
      lines:   plant ? (FILTER_OPTIONS.lines[plant] || []) : [],
    });
    setLoadingFilters(false);
  }, [user, plant]);

  // ── Fetch metrics dari Supabase ──
  const fetchMetrics = useCallback(async () => {
    if (!user || !tab || !plant || !period) return;
    if (!canAccessPlant(plant)) {
      setErrorMetrics(`Anda tidak memiliki akses ke ${plant}.`);
      return;
    }

    setLoadingMetrics(true);
    setErrorMetrics(null);
    setMetrics(null);

    try {
      const { data, error } = await supabase
        .from('metrics')
        .select('*')
        .eq('tab',    tab)
        .eq('plant',  plant)
        .eq('period', period)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setErrorMetrics(`Data tidak tersedia: ${tab} / ${plant} / ${period}`);
        } else {
          throw error;
        }
        return;
      }

      // Terapkan filter shift (scale data)
      let result = {
        ...data,
        trend: data.trend || {},
        chart: data.chart || [],
      };

      if (shift && shift !== 'All Shifts') result = applyShiftFilter(result, shift);
      if (line  && line  !== 'All Lines')  result = applyLineFilter(result, line);

      setMetrics(result);
    } catch (err) {
      console.error('[useDashboard] fetchMetrics error:', err);
      setErrorMetrics(err.message || 'Gagal mengambil data dari Supabase.');
    } finally {
      setLoadingMetrics(false);
    }
  }, [user, tab, plant, period, shift, line, canAccessPlant]);

  // ── Fetch submissions ──
  const fetchSubmissions = useCallback(async () => {
    if (!user || !plant) return;
    try {
      let query = supabase
        .from('submissions')
        .select('*')
        .eq('plant', plant)
        .eq('tab',   tab)
        .order('created_at', { ascending: false });

      // pic_staff hanya lihat miliknya
      if (user.role === 'pic_staff') {
        query = query.eq('submitted_by', user.name);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('[useDashboard] fetchSubmissions error:', err);
      setSubmissions([]);
    }
  }, [user, plant, tab]);

  // ── Approve / Reject submission ──
  const updateSubmission = useCallback(async (id, status) => {
    if (!user) return { success: false };
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status, approved_by: user.name })
        .eq('id', id);
      if (error) throw error;
      await fetchSubmissions();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [user, fetchSubmissions]);

  useEffect(() => { fetchMetrics(); },    [fetchMetrics]);

  return {
    filterOptions, metrics, submissions,
    loadingFilters, loadingMetrics,
    errorMetrics,
    refetchMetrics:     fetchMetrics,
    refetchSubmissions: fetchSubmissions,
    updateSubmission,
  };
}

// ── Helper: scale data per shift ──
function applyShiftFilter(data, shift) {
  const mod = shift.includes('1') ? 0.38 : shift.includes('2') ? 0.34 : 0.28;
  const scale = (v) => v != null ? Math.round(v * mod) : v;
  return {
    ...data,
    production: scale(data.production),
    defect:     scale(data.defect),
    downtime:   scale(data.downtime),
    chart: data.chart?.map(w => {
      const out = { week: w.week };
      Object.keys(w).forEach(k => { if (k !== 'week') out[k] = typeof w[k] === 'number' ? Math.round(w[k] * mod) : w[k]; });
      return out;
    }),
  };
}

function applyLineFilter(data, line) {
  const n = parseInt(line.replace(/\D/g,'')) || 1;
  const mod = 1/3 + (n % 2 === 0 ? 0.05 : -0.02);
  const scale = (v) => v != null ? Math.round(v * mod) : v;
  return {
    ...data,
    production: scale(data.production),
    defect:     scale(data.defect),
    downtime:   scale(data.downtime),
    chart: data.chart?.map(w => {
      const out = { week: w.week };
      Object.keys(w).forEach(k => { if (k !== 'week') out[k] = typeof w[k] === 'number' ? Math.round(w[k] * mod) : w[k]; });
      return out;
    }),
  };
}
