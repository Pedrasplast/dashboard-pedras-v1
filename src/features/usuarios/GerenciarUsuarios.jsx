import {
  FiArrowLeft,
  FiSettings,
  FiUserPlus,
} from "react-icons/fi";

import PageHeader from "@/components/layout/PageHeader";
import { useNavigate } from "@/lib/navegacao";

import ExcluirUsuarioModal
  from "./components/ExcluirUsuarioModal.jsx";

import NovoUsuarioModal
  from "./components/NovoUsuarioModal.jsx";

import PermissoesModal
  from "./components/PermissoesModal.jsx";

import UsuariosTable
  from "./components/UsuariosTable.jsx";

import useGerenciarUsuarios
  from "./hooks/useGerenciarUsuarios.js";

import "./GerenciarUsuarios.css";


export default function GerenciarUsuarios() {
  const navigate =
    useNavigate();

  const {
    usuarios,
    loading,
    mensagem,

    telasGerenciaveis,
    telasPorModulo,
    relatoriosPorCategoria,
    relatoriosLiberados,
    resumoPermissoesModal,

    modalNovoUsuario,
    emailNovoUsuario,
    criandoUsuario,
    linkPrimeiroAcesso,
    emailUsuarioCriado,
    linkCopiado,

    usuarioPermissoes,
    permissoesTemporarias,
    permissoesRelatoriosTemporarias,
    salvandoPermissoes,

    usuarioParaExcluir,

    setEmailNovoUsuario,

    abrirNovoUsuario,
    fecharNovoUsuario,
    cadastrarNovoUsuario,
    copiarLinkPrimeiroAcesso,

    alterarRegra,
    abrirPermissoes,
    fecharModalPermissoes,
    alterarPermissaoTemporaria,
    alterarPermissaoRelatorio,
    obterStatusModulo,
    definirPermissaoModulo,
    marcarTodasTelas,
    desmarcarTodasTelas,
    marcarTodosRelatorios,
    desmarcarTodosRelatorios,
    salvarPermissoes,
    contarPermissoes,

    solicitarExclusao,
    cancelarExclusao,
    confirmarExclusao,
  } =
    useGerenciarUsuarios();

  return (
    <div className="gerenciar-usuarios-container">
     
      <PageHeader
        eyebrow="Administração"
        title="Gerenciamento de Usuários"
        titleAs="h2"
        description="Altere os níveis de acesso e escolha quais módulos, telas e relatórios cada colaborador poderá acessar."
        icon={FiSettings}
        className="admin-header-block admin-header-com-acoes"
        actions={
          <button
            type="button"
            className="btn-novo-usuario"
            onClick={
              abrirNovoUsuario
            }
          >
            <FiUserPlus />

            <span>
              Cadastrar usuário
            </span>
          </button>
        }
      />


      {mensagem.texto && (
        <div
          className={
            `alert-message ${mensagem.tipo}`
          }
        >
          <span>
            {mensagem.texto}
          </span>
        </div>
      )}


      {loading ? (
        <div className="loading-state">
          Carregando usuários...
        </div>
      ) : (
        <UsuariosTable
          usuarios={
            usuarios
          }
          totalTelas={
            telasGerenciaveis.length
          }
          contarPermissoes={
            contarPermissoes
          }
          onAbrirPermissoes={
            abrirPermissoes
          }
          onAlterarRegra={
            alterarRegra
          }
          onExcluir={
            solicitarExclusao
          }
        />
      )}


      <NovoUsuarioModal
        aberto={
          modalNovoUsuario
        }
        email={
          emailNovoUsuario
        }
        criando={
          criandoUsuario
        }
        linkPrimeiroAcesso={
          linkPrimeiroAcesso
        }
        emailUsuarioCriado={
          emailUsuarioCriado
        }
        linkCopiado={
          linkCopiado
        }
        onEmailChange={
          setEmailNovoUsuario
        }
        onSubmit={
          cadastrarNovoUsuario
        }
        onCopiarLink={
          copiarLinkPrimeiroAcesso
        }
        onFechar={
          fecharNovoUsuario
        }
      />


      <PermissoesModal
        usuario={
          usuarioPermissoes
        }
        telasPorModulo={
          telasPorModulo
        }
        permissoesTelas={
          permissoesTemporarias
        }
        permissoesRelatorios={
          permissoesRelatoriosTemporarias
        }
        relatoriosLiberados={
          relatoriosLiberados
        }
        relatoriosPorCategoria={
          relatoriosPorCategoria
        }
        resumo={
          resumoPermissoesModal
        }
        salvando={
          salvandoPermissoes
        }
        onFechar={
          fecharModalPermissoes
        }
        onMarcarTodasTelas={
          marcarTodasTelas
        }
        onDesmarcarTodasTelas={
          desmarcarTodasTelas
        }
        onObterStatusModulo={
          obterStatusModulo
        }
        onDefinirModulo={
          definirPermissaoModulo
        }
        onToggleTela={
          alterarPermissaoTemporaria
        }
        onToggleRelatorio={
          alterarPermissaoRelatorio
        }
        onMarcarTodosRelatorios={
          marcarTodosRelatorios
        }
        onDesmarcarTodosRelatorios={
          desmarcarTodosRelatorios
        }
        onSalvar={
          salvarPermissoes
        }
      />


      <ExcluirUsuarioModal
        usuario={
          usuarioParaExcluir
        }
        onCancelar={
          cancelarExclusao
        }
        onConfirmar={
          confirmarExclusao
        }
      />

    </div>
  );
}