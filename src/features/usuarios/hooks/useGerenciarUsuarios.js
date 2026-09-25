import { useCallback, useEffect, useMemo, useState } from "react";

import { CHAVE_TELA_RELATORIOS, MODULOS_PERMISSOES } from "../constants/gerenciarUsuariosConfig.js";

import {
  atualizarRegraUsuario,
  buscarDadosGerenciamento,
  cadastrarUsuario,
  excluirUsuarioCompleto,
  salvarPermissoesUsuario,
} from "../services/gerenciarUsuariosService.js";

import {
  agruparRelatoriosPorCategoria,
  agruparTelasPorModulo,
  contarPermissoesUsuario,
  contarSelecionados,
  criarMapaPermissoes,
  criarMapaSelecao,
  emailValido,
  obterStatusModulo as calcularStatusModulo,
  obterTelasGerenciaveis,
} from "../utils/gerenciarUsuariosUtils.js";

const MENSAGEM_INICIAL = Object.freeze({
  tipo: "",

  texto: "",
});

export default function useGerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [telas, setTelas] = useState([]);

  const [relatorios, setRelatorios] = useState([]);

  const [permissoesPorUsuario, setPermissoesPorUsuario] = useState({});

  const [permissoesRelatoriosPorUsuario, setPermissoesRelatoriosPorUsuario] = useState({});

  const [loading, setLoading] = useState(true);

  const [mensagem, setMensagem] = useState(MENSAGEM_INICIAL);

  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

  const [usuarioPermissoes, setUsuarioPermissoes] = useState(null);

  const [permissoesTemporarias, setPermissoesTemporarias] = useState({});

  const [permissoesRelatoriosTemporarias, setPermissoesRelatoriosTemporarias] = useState({});

  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);

  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);

  const [emailNovoUsuario, setEmailNovoUsuario] = useState("");

  const [criandoUsuario, setCriandoUsuario] = useState(false);

  const [linkPrimeiroAcesso, setLinkPrimeiroAcesso] = useState("");

  const [emailUsuarioCriado, setEmailUsuarioCriado] = useState("");

  const [linkCopiado, setLinkCopiado] = useState(false);

  /* =========================================================
     LIMPAR MENSAGEM
  ========================================================= */

  useEffect(() => {
    if (!mensagem.texto) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMensagem(MENSAGEM_INICIAL);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mensagem]);

  /* =========================================================
     CARREGAR DADOS
  ========================================================= */

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      const dados = await buscarDadosGerenciamento();

      setUsuarios(dados.usuarios);

      setTelas(dados.telas);

      setRelatorios(dados.relatorios);

      setPermissoesPorUsuario(criarMapaPermissoes(dados.permissoes, "tela_id"));

      setPermissoesRelatoriosPorUsuario(
        criarMapaPermissoes(dados.permissoesRelatorios, "relatorio_id"),
      );
    } catch (error) {
      setMensagem({
        tipo: "erro",

        texto: "Erro ao buscar usuários: " + (error?.message || "erro desconhecido"),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarUsuarios();
  }, [carregarUsuarios]);

  /* =========================================================
     DADOS DERIVADOS
  ========================================================= */

  const telasGerenciaveis = useMemo(() => obterTelasGerenciaveis(telas), [telas]);

  const telasPorModulo = useMemo(
    () => agruparTelasPorModulo(telasGerenciaveis, MODULOS_PERMISSOES),
    [telasGerenciaveis],
  );

  const relatoriosPorCategoria = useMemo(
    () => agruparRelatoriosPorCategoria(relatorios),
    [relatorios],
  );

  const telaRelatorios = useMemo(
    () => telas.find((tela) => tela.chave === CHAVE_TELA_RELATORIOS) || null,
    [telas],
  );

  const relatoriosLiberados = useMemo(
    () => (telaRelatorios ? Boolean(permissoesTemporarias[String(telaRelatorios.id)]) : false),
    [telaRelatorios, permissoesTemporarias],
  );

  const resumoPermissoesModal = useMemo(
    () => ({
      telasLiberadas: contarSelecionados(telasGerenciaveis, permissoesTemporarias),

      totalTelas: telasGerenciaveis.length,

      relatoriosPermitidos: contarSelecionados(relatorios, permissoesRelatoriosTemporarias),

      totalRelatorios: relatorios.length,
    }),
    [telasGerenciaveis, relatorios, permissoesTemporarias, permissoesRelatoriosTemporarias],
  );

  /* =========================================================
     NOVO USUÁRIO
  ========================================================= */

  const abrirNovoUsuario = useCallback(() => {
    setEmailNovoUsuario("");

    setLinkPrimeiroAcesso("");

    setEmailUsuarioCriado("");

    setLinkCopiado(false);

    setModalNovoUsuario(true);
  }, []);

  const fecharNovoUsuario = useCallback(() => {
    if (criandoUsuario) {
      return;
    }

    setModalNovoUsuario(false);

    setEmailNovoUsuario("");

    setLinkPrimeiroAcesso("");

    setEmailUsuarioCriado("");

    setLinkCopiado(false);
  }, [criandoUsuario]);

  const cadastrarNovoUsuario = useCallback(
    async (event) => {
      event.preventDefault();

      const email = String(emailNovoUsuario || "")
        .trim()
        .toLowerCase();

      if (!email) {
        setMensagem({
          tipo: "erro",

          texto: "Informe o e-mail do novo usuário.",
        });

        return;
      }

      if (!emailValido(email)) {
        setMensagem({
          tipo: "erro",

          texto: "Informe um e-mail válido.",
        });

        return;
      }

      try {
        setCriandoUsuario(true);

        setLinkCopiado(false);

        const redirectTo = `${window.location.origin}/definir-senha`;

        const data = await cadastrarUsuario({
          email,
          redirectTo,
        });

        setEmailUsuarioCriado(data?.usuario?.email || email);

        setLinkPrimeiroAcesso(data.link_primeiro_acesso);

        setMensagem({
          tipo: "sucesso",

          texto: "Usuário cadastrado com sucesso!",
        });

        await carregarUsuarios();
      } catch (error) {
        setMensagem({
          tipo: "erro",

          texto: error?.message || "Não foi possível cadastrar o usuário.",
        });
      } finally {
        setCriandoUsuario(false);
      }
    },
    [emailNovoUsuario, carregarUsuarios],
  );

  const copiarLinkPrimeiroAcesso = useCallback(async () => {
    if (!linkPrimeiroAcesso) {
      return;
    }

    try {
      await navigator.clipboard.writeText(linkPrimeiroAcesso);

      setLinkCopiado(true);

      window.setTimeout(() => {
        setLinkCopiado(false);
      }, 2000);
    } catch {
      setMensagem({
        tipo: "erro",

        texto:
          "Não foi possível copiar o link automaticamente. Selecione o link e copie manualmente.",
      });
    }
  }, [linkPrimeiroAcesso]);

  /* =========================================================
     NÍVEL
  ========================================================= */

  const alterarRegra = useCallback(async (usuarioId, novaRegra) => {
    try {
      await atualizarRegraUsuario(usuarioId, novaRegra);

      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === usuarioId
            ? {
                ...usuario,

                regra: novaRegra,
              }
            : usuario,
        ),
      );

      setMensagem({
        tipo: "sucesso",

        texto: "Nível de acesso atualizado com sucesso!",
      });
    } catch (error) {
      setMensagem({
        tipo: "erro",

        texto: "Erro ao atualizar nível: " + (error?.message || "erro desconhecido"),
      });
    }
  }, []);

  /* =========================================================
     MODAL DE PERMISSÕES
  ========================================================= */

  const abrirPermissoes = useCallback(
    (usuario) => {
      if (usuario.regra === "admin") {
        return;
      }

      const permissoesAtuais = permissoesPorUsuario[usuario.id] || {};

      const relatoriosAtuais = permissoesRelatoriosPorUsuario[usuario.id] || {};

      setUsuarioPermissoes(usuario);

      setPermissoesTemporarias(criarMapaSelecao(telas, permissoesAtuais));

      setPermissoesRelatoriosTemporarias(criarMapaSelecao(relatorios, relatoriosAtuais));
    },
    [permissoesPorUsuario, permissoesRelatoriosPorUsuario, telas, relatorios],
  );

  const fecharModalPermissoes = useCallback(() => {
    if (salvandoPermissoes) {
      return;
    }

    setUsuarioPermissoes(null);

    setPermissoesTemporarias({});

    setPermissoesRelatoriosTemporarias({});
  }, [salvandoPermissoes]);

  const alterarPermissaoTemporaria = useCallback((telaId) => {
    const chave = String(telaId);

    setPermissoesTemporarias((prev) => ({
      ...prev,

      [chave]: !prev[chave],
    }));
  }, []);

  const alterarPermissaoRelatorio = useCallback((relatorioId) => {
    const chave = String(relatorioId);

    setPermissoesRelatoriosTemporarias((prev) => ({
      ...prev,

      [chave]: !prev[chave],
    }));
  }, []);

  const obterStatusModulo = useCallback(
    (modulo) => calcularStatusModulo(modulo, permissoesTemporarias),
    [permissoesTemporarias],
  );

  const definirPermissaoModulo = useCallback((modulo, permitido) => {
    setPermissoesTemporarias((prev) => {
      const proximo = {
        ...prev,
      };

      for (const tela of modulo.telas) {
        proximo[String(tela.id)] = permitido;
      }

      return proximo;
    });
  }, []);

  const marcarTodasTelas = useCallback(() => {
    setPermissoesTemporarias((prev) => {
      const novasPermissoes = {
        ...prev,
      };

      for (const tela of telasGerenciaveis) {
        novasPermissoes[String(tela.id)] = true;
      }

      return novasPermissoes;
    });
  }, [telasGerenciaveis]);

  const desmarcarTodasTelas = useCallback(() => {
    setPermissoesTemporarias((prev) => {
      const novasPermissoes = {
        ...prev,
      };

      for (const tela of telasGerenciaveis) {
        novasPermissoes[String(tela.id)] = false;
      }

      return novasPermissoes;
    });
  }, [telasGerenciaveis]);

  const marcarTodosRelatorios = useCallback(() => {
    const mapa = {};

    for (const relatorio of relatorios) {
      mapa[String(relatorio.id)] = true;
    }

    setPermissoesRelatoriosTemporarias(mapa);
  }, [relatorios]);

  const desmarcarTodosRelatorios = useCallback(() => {
    const mapa = {};

    for (const relatorio of relatorios) {
      mapa[String(relatorio.id)] = false;
    }

    setPermissoesRelatoriosTemporarias(mapa);
  }, [relatorios]);

  /* =========================================================
     SALVAR PERMISSÕES
  ========================================================= */

  const salvarPermissoes = useCallback(async () => {
    if (!usuarioPermissoes) {
      return;
    }

    try {
      setSalvandoPermissoes(true);

      await salvarPermissoesUsuario({
        usuarioId: usuarioPermissoes.id,

        telas,

        relatorios,

        permissoesTelas: permissoesTemporarias,

        permissoesRelatorios: permissoesRelatoriosTemporarias,
      });

      setPermissoesPorUsuario((prev) => ({
        ...prev,

        [usuarioPermissoes.id]: {
          ...permissoesTemporarias,
        },
      }));

      setPermissoesRelatoriosPorUsuario((prev) => ({
        ...prev,

        [usuarioPermissoes.id]: {
          ...permissoesRelatoriosTemporarias,
        },
      }));

      setMensagem({
        tipo: "sucesso",

        texto: `Permissões de ${usuarioPermissoes.email} atualizadas com sucesso!`,
      });

      setUsuarioPermissoes(null);

      setPermissoesTemporarias({});

      setPermissoesRelatoriosTemporarias({});
    } catch (error) {
      setMensagem({
        tipo: "erro",

        texto: "Erro ao salvar permissões: " + (error?.message || "erro desconhecido"),
      });
    } finally {
      setSalvandoPermissoes(false);
    }
  }, [
    usuarioPermissoes,
    telas,
    relatorios,
    permissoesTemporarias,
    permissoesRelatoriosTemporarias,
  ]);

  /* =========================================================
     EXCLUSÃO
  ========================================================= */

  const solicitarExclusao = useCallback((usuario) => {
    setUsuarioParaExcluir(usuario);
  }, []);

  const cancelarExclusao = useCallback(() => {
    setUsuarioParaExcluir(null);
  }, []);

  const confirmarExclusao = useCallback(async () => {
    if (!usuarioParaExcluir) {
      return;
    }

    const usuarioId = usuarioParaExcluir.id;

    try {
      await excluirUsuarioCompleto(usuarioId);

      setUsuarios((prev) => prev.filter((usuario) => usuario.id !== usuarioId));

      setPermissoesPorUsuario((prev) => {
        const proximo = {
          ...prev,
        };

        delete proximo[usuarioId];

        return proximo;
      });

      setPermissoesRelatoriosPorUsuario((prev) => {
        const proximo = {
          ...prev,
        };

        delete proximo[usuarioId];

        return proximo;
      });

      setUsuarioParaExcluir(null);

      setMensagem({
        tipo: "sucesso",

        texto: "Usuário excluído completamente com sucesso!",
      });
    } catch (error) {
      setMensagem({
        tipo: "erro",

        texto: "Erro ao excluir usuário: " + (error?.message || "erro desconhecido"),
      });
    }
  }, [usuarioParaExcluir]);

  /* =========================================================
     CONTADOR
  ========================================================= */

  const contarPermissoes = useCallback(
    (usuarioId) =>
      contarPermissoesUsuario({
        usuarioId,

        permissoesPorUsuario,

        telasGerenciaveis,
      }),
    [permissoesPorUsuario, telasGerenciaveis],
  );

  return {
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
  };
}
