import { useAuthContext } from "../lib/auth-context";

/*
 * Perfil e nível de acesso, vindos do provedor global.
 */
export function usePerfil() {
  const { perfil, isAdmin, loadingPerfil } = useAuthContext();
  return { perfil, isAdmin, loadingPerfil };
}
