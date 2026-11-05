const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const key = (
  import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || ''
).trim();

export const isSupabaseConfigured = Boolean(url && key);
export const supabaseUrl = url;
export const supabaseKey = key;
