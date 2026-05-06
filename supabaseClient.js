const SUPABASE_URL      = window.__env__?.SUPABASE_URL      || window.electron?.env?.SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = window.__env__?.SUPABASE_ANON_KEY || window.electron?.env?.SUPABASE_ANON_KEY || '';

export let supabase = null;
export let isSupabaseEnabled = false;

if (SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase?.createClient) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  isSupabaseEnabled = true;
  console.log('[Supabase] Cliente inicializado com sucesso.');
} else {
  console.warn('[Supabase] Desativado — configure SUPABASE_URL e SUPABASE_ANON_KEY.');
}
