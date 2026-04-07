// lib/supabase.js — Supabase client singleton
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum di-set!\n' +
    'Buat file .env.local dan isi kedua variabel tersebut.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
});

// ── Helper: ambil profile user dari tabel profiles ──
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ── Permission matrix per role ──
export const PERMISSIONS = {
  super_admin:   ['view:all_plants','view:metrics','view:submissions','manage:users','submit:forms','approve:submissions','export:data'],
  administrator: ['view:assigned_plants','view:metrics','view:submissions','manage:users','submit:forms','export:data'],
  approver:      ['view:assigned_plants','view:metrics','view:submissions','approve:submissions','export:data'],
  pic_staff:     ['view:assigned_plants','view:metrics','submit:forms'],
};

export const ROLE_CONFIG = {
  super_admin:   { label:'Super Admin',   color:'#FF6B6B', bg:'rgba(255,107,107,0.12)', icon:'👑' },
  administrator: { label:'Administrator', color:'#6C63FF', bg:'rgba(108,99,255,0.12)',  icon:'🛡️' },
  approver:      { label:'Approver',      color:'#FFD93D', bg:'rgba(255,217,61,0.12)',  icon:'✅' },
  pic_staff:     { label:'PIC Staff',     color:'#00C9A7', bg:'rgba(0,201,167,0.12)',   icon:'📋' },
};

// Filter options (static — tidak perlu query DB)
export const FILTER_OPTIONS = {
  plants:  ['Plant A', 'Plant B', 'Plant C'],
  periods: ['Jan 2025', 'Feb 2025', 'Mar 2025'],
  shifts:  ['All Shifts', 'Shift 1 (06-14)', 'Shift 2 (14-22)', 'Shift 3 (22-06)'],
  lines:   {
    'Plant A': ['All Lines', 'Line 1', 'Line 2', 'Line 3'],
    'Plant B': ['All Lines', 'Line 1', 'Line 2'],
    'Plant C': ['All Lines', 'Line 1', 'Line 2', 'Line 3', 'Line 4'],
  },
};
