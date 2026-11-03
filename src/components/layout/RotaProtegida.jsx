import { useEffect } from "react";

import { useContextoAuth } from "@/lib/contextoAuth";
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
export default function RotaProtegida({ children, exigirAdmin = false, permissao = null }) {
  const { usuario, ehAdmin, carregandoAuth, carregandoPerfil } = useContextoAuth();

  const { podeAcessarTela, carregandoPermissoes } = usePermissoes();

  const navigate = useNavigate();

  const precisaCarregarPermissoes = Boolean(usuario && !ehAdmin && !exigirAdmin && permissao);

  const carregando =
    carregandoAuth || carregandoPerfil || (precisaCarregarPermissoes && carregandoPermissoes);

  const semLogin = !carregando && !usuario;

  const semAcessoAdmin = !carregando && Boolean(usuario && exigirAdmin && !ehAdmin);

  const semPermissaoTela =
    !carregando &&
    Boolean(usuario && !ehAdmin && !exigirAdmin && permissao && !podeAcessarTela(permissao));

  const semAcesso = semLogin || semAcessoAdmin || semPermissaoTela;

  useEffect(() => {
    if (!semAcesso) {
      return;
    }

    if (!usuario) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    navigate("/", {
      replace: true,
    });
  }, [semAcesso, usuario, navigate]);

  if (carregando) {
    return <div className="estado-carregando">Carregando...</div>;
  }

  if (semAcesso) {
    return null;
  }

  return children;
}
