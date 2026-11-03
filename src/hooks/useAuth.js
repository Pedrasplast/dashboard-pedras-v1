import { useAuthContext } from "../lib/contextoAuth";

/*
 * Sessão atual do usuário, vinda do provedor global.
 */
export function useAuth() {
  const { usuario, carregandoAuth } = useAuthContext();
  return { usuario, carregandoAuth };
}
