import { createClient } from '@supabase/supabase-js';

// These should be defined in your .env.local as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Non-fatal warning in dev; helps catch misconfigurations
  console.warn('Supabase env vars are not set. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Expose for debugging in dev so you can run `window.supabase.auth.getSession()` in console
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
}
