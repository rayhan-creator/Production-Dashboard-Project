// hooks/useDashboard.js — Custom hook semua API calls dashboard
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export function useDashboard({ tab, plant, period, shift, line }) {
  const { token, apiBase } = useAuth();

  const [filterOptions, setFilterOptions] = useState({ plants:[], periods:[], shifts:[], lines:[] });
  const [metrics,       setMetrics]       = useState(null);
  const [submissions,   setSubmissions]   = useState([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [errorFilters,   setErrorFilters]   = useState(null);
  const [errorMetrics,   setErrorMetrics]   = useState(null);

  const abortRef = useRef(null);

  const apiFetch = useCallback(async (path, signal) => {
    const res = await fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  }, [token, apiBase]);

  const fetchFilters = useCallback(async () => {
    if (!token) return;
    setLoadingFilters(true);
    setErrorFilters(null);
    try {
      const params = plant ? `?plant=${encodeURIComponent(plant)}` : '';
      const data = await apiFetch(`/dashboard/filters${params}`);
      setFilterOptions({
        plants:  data.data.plants  || [],
        periods: data.data.periods || [],
        shifts:  data.data.shifts  || [],
        lines:   data.data.lines   || [],
      });
    } catch (err) {
      if (err.name !== 'AbortError') setErrorFilters(err.message);
    } finally {
      setLoadingFilters(false);
    }
  }, [token, plant, apiFetch]);

  const fetchMetrics = useCallback(async () => {
    if (!token || !tab || !plant || !period) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoadingMetrics(true);
    setErrorMetrics(null);
    setMetrics(null);
    try {
      const params = new URLSearchParams({ tab, plant, period });
      if (shift && shift !== 'All Shifts') params.set('shift', shift);
      if (line  && line  !== 'All Lines')  params.set('line',  line);
      const data = await apiFetch(`/dashboard/metrics?${params}`, abortRef.current.signal);
      setMetrics(data.data);
    } catch (err) {
      if (err.name !== 'AbortError') setErrorMetrics(err.message || 'Gagal mengambil data dari server.');
    } finally {
      setLoadingMetrics(false);
    }
  }, [token, tab, plant, period, shift, line, apiFetch]);

  const fetchSubmissions = useCallback(async () => {
    if (!token || !plant) return;
    try {
      const params = new URLSearchParams({ plant, tab });
      const data = await apiFetch(`/dashboard/submissions?${params}`);
      setSubmissions(data.data || []);
    } catch { setSubmissions([]); }
  }, [token, plant, tab, apiFetch]);

  useEffect(() => { fetchFilters(); },    [fetchFilters]);
  useEffect(() => { fetchMetrics(); },    [fetchMetrics]);

  return {
    filterOptions, metrics, submissions,
    loadingFilters, loadingMetrics,
    errorFilters, errorMetrics,
    refetchMetrics: fetchMetrics,
    refetchSubmissions: fetchSubmissions,
  };
}
