import { useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useNavigate } from "@/lib/navegacao";

/*
 * Portão de acesso das telas internas.
 *
 * Reproduz o comportamento original (redirecionar quando
 * não autenticado ou sem permissão) sem duplicar consultas
 * de sessão em cada tela.
 */
export default function RotaProtegida({ children, exigirAdmin = false }) {
  const { user, isAdmin, loadingAuth, loadingPerfil } = useAuthContext();
  const navigate = useNavigate();

  const carregando = loadingAuth || (exigirAdmin && loadingPerfil);
  const semAcesso = !carregando && (!user || (exigirAdmin && !isAdmin));

  useEffect(() => {
    if (!semAcesso) return;
    navigate(!user ? "/login" : "/", { replace: true });
  }, [semAcesso, user, navigate]);

  if (carregando) {
    return <div className="estado-carregando">Carregando...</div>;
  }

  if (semAcesso) {
    return null;
  }

  return children;
}
