import { useAuthContext } from "../lib/auth-context";

/*
 * Sessão atual do usuário, vinda do provedor global.
 */
export function useAuth() {
  const { user, loadingAuth } = useAuthContext();
  return { user, loadingAuth };
}
