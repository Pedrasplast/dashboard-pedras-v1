import { createClient } from "@supabase/supabase-js";

/*
 * Credenciais publicáveis do Supabase.
 *
 * Vêm das variáveis de ambiente VITE_* e, na ausência delas,
 * caem para os valores injetados pelo runtime do servidor.
 */
const urlSupabase =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;

const chaveAnonSupabase =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.SUPABASE_PUBLISHABLE_KEY;

if (!urlSupabase || !chaveAnonSupabase) {
  console.warn(
    "⚠️ Credenciais do Supabase ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
  );
}

/*
 * Cliente único da aplicação.
 *
 * Criado uma só vez por sessão do navegador, evitando
 * múltiplas instâncias de auth e listeners duplicados.
 */
export const supabase = createClient(
  urlSupabase ?? "https://placeholder.supabase.co",
  chaveAnonSupabase ?? "public-anon-key",
  {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
  },
);
