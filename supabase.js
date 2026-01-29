// Supabase client config (replace with your project values)
const SUPABASE_URL = window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG.URL : "";
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG.KEY : "";

const supabaseClient = (window.supabase && SUPABASE_URL)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const isSupabaseConfigured =
  Boolean(supabaseClient) &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY.startsWith("sb_publishable_");

// Expose to other scripts
window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
