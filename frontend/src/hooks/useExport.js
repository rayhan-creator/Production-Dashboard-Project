// hooks/useExport.js
// ============================================================
// Custom hook untuk export data dashboard ke file Excel (.xlsx)
// Pakai library 'xlsx' (SheetJS) yang sudah ada di package.json
// ============================================================
import { useCallback, useState } from 'react';

export function useExport() {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = useCallback(async ({ metrics, tab, plant, period, shift, line }) => {
    if (!metrics || exporting) return;
    setExporting(true);

    try {
      // Dynamic import supaya xlsx tidak masuk main bundle
      const XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary Metrics ──
      const summaryData = [
        ['Production Dashboard Mini — PT. Denso Indonesia PED'],
        [],
        ['Tab',        tab],
        ['Plant',      plant],
        ['Period',     period],
        ['Shift',      shift || 'All Shifts'],
        ['Line',       line  || 'All Lines'],
        ['Export Time', new Date().toLocaleString('id-ID')],
        [],
        ['Metric',          'Value', 'Unit',  'Trend (%)'],
        ['Production',      metrics.production,  'units',  metrics.trend?.production  ?? '-'],
        ['Defect',          metrics.defect,       'pcs',   metrics.trend?.defect      ?? '-'],
        ['Efficiency',      metrics.efficiency,   '%',     metrics.trend?.efficiency  ?? '-'],
        ['Downtime',        metrics.downtime,     'min',   '-'],
        ['OEE',             metrics.oee,          '%',     '-'],
        ['Incidents',       metrics.incidents,    'case',  metrics.trend?.incidents   ?? '-'],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

      // Style: lebar kolom
      ws1['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }, { wch: 12 }];

      // Merge baris judul
      ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // ── Sheet 2: Weekly Chart Data ──
      if (metrics.chart && metrics.chart.length > 0) {
        const headers = Object.keys(metrics.chart[0]);
        const chartData = [
          [`Weekly Data — ${tab}`],
          [],
          headers,
          ...metrics.chart.map(row => headers.map(h => row[h])),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(chartData);
        ws2['!cols'] = headers.map(() => ({ wch: 14 }));
        ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Weekly Data');
      }

      // ── Sheet 3: OEE Breakdown ──
      const oeeData = [
        ['OEE Breakdown'],
        [],
        ['Component',    'Value (%)', 'Status'],
        ['Availability', 92,  92 >= 90 ? '✓ Good' : '⚠ Low'],
        ['Performance',  88,  88 >= 85 ? '✓ Good' : '⚠ Low'],
        ['Quality',      96,  96 >= 95 ? '✓ Good' : '⚠ Low'],
        ['OEE Total',    metrics.oee, metrics.oee >= 85 ? '✓ Good' : metrics.oee >= 70 ? '⚠ Fair' : '✗ Low'],
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(oeeData);
      ws3['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 12 }];
      ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
      XLSX.utils.book_append_sheet(wb, ws3, 'OEE Breakdown');

      // Generate nama file
      const safePeriod = period.replace(' ', '_');
      const filename = `DensoDashboard_${tab}_${plant.replace(' ','')}_${safePeriod}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('[Export] Error:', err);
      alert('Export gagal: ' + err.message);
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  return { exportToExcel, exporting };
}
