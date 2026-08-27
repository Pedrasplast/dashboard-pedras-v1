import { useEffect } from "react";

import { useAuthContext } from "@/lib/auth-context";
import { useNavigate } from "@/lib/navegacao";
import { usePermissoes } from "@/hooks/usePermissoes";

/*
 * Portão de acesso das telas internas.
 *
 * Regras:
 *
 * - Sem login:
 *   envia para /login.
 *
 * - ADMIN:
 *   acesso total automático.
 *
 * - OPERADOR:
 *   precisa possuir a permissão
 *   correspondente à tela.
 *
 * - exigirAdmin:
 *   continua reservado para telas
 *   exclusivamente administrativas,
 *   como Gerenciar Usuários.
 */
export default function RotaProtegida({
  children,
  exigirAdmin = false,
  permissao = null,
}) {
  const {
    user,
    isAdmin,
    loadingAuth,
    loadingPerfil,
  } = useAuthContext();

  const {
    podeAcessarTela,
    loadingPermissoes,
  } = usePermissoes();

  const navigate = useNavigate();

  const precisaCarregarPermissoes =
    Boolean(
      user &&
      !isAdmin &&
      !exigirAdmin &&
      permissao
    );

  const carregando =
    loadingAuth ||
    loadingPerfil ||
    (
      precisaCarregarPermissoes &&
      loadingPermissoes
    );

  const semLogin =
    !carregando &&
    !user;

  const semAcessoAdmin =
    !carregando &&
    Boolean(
      user &&
      exigirAdmin &&
      !isAdmin
    );

  const semPermissaoTela =
    !carregando &&
    Boolean(
      user &&
      !isAdmin &&
      !exigirAdmin &&
      permissao &&
      !podeAcessarTela(permissao)
    );

  const semAcesso =
    semLogin ||
    semAcessoAdmin ||
    semPermissaoTela;

  useEffect(() => {
    if (!semAcesso) {
      return;
    }

    if (!user) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    navigate(
      "/",
      {
        replace: true,
      }
    );
  }, [
    semAcesso,
    user,
    navigate,
  ]);

  if (carregando) {
    return (
      <div className="estado-carregando">
        Carregando...
      </div>
    );
  }

  if (semAcesso) {
    return null;
  }

  return children;
}