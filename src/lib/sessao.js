import { supabase } from "./supabaseClient";

/*
 * Token de acesso da sessão atual, para chamar as server functions
 * (que validam o usuário no servidor).
 */
export async function obterTokenAcesso() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error("Não foi possível validar sua sessão.");
  }

  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  }

  return accessToken;
}
