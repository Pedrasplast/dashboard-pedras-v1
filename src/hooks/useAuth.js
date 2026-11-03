import { useContextoAuth } from "../lib/contextoAuth";

/*
 * Sessão atual do usuário, vinda do provedor global.
 */
export function useAuth() {
  const { usuario, carregandoAuth } = useContextoAuth();
  return { usuario, carregandoAuth };
}
