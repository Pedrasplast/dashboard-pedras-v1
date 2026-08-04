import { createClient } from '@supabase/supabase-js';

const urlSupabase = import.meta.env.VITE_SUPABASE_URL;

const chaveAnonSupabase =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!urlSupabase) {
  throw new Error(
    'A variável VITE_SUPABASE_URL não foi configurada.',
  );
}

if (!chaveAnonSupabase) {
  throw new Error(
    'A variável VITE_SUPABASE_ANON_KEY não foi configurada.',
  );
}

export const supabase = createClient(
  urlSupabase,
  chaveAnonSupabase,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);