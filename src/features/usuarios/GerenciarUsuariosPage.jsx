import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useNavigate } from "@/lib/navegacao";

import {
  FiArrowLeft,
  FiAlertTriangle,
  FiSettings,
  FiFileText,
  FiUserPlus,
  FiCopy,
  FiX,
} from "react-icons/fi";

import { supabase } from "@/lib/supabaseClient";

import "./GerenciarUsuarios.css";


/* =========================================================
   MÓDULOS DE PERMISSÃO

   A organização acompanha a nova Navbar.
   "usuarios" não aparece aqui porque Gerenciar usuários
   continua sendo exclusivo de administradores.
========================================================= */

const MODULOS_PERMISSOES = Object.freeze([
  {
    id: "producao",
    nome: "Produção",
    descricao:
      "Dashboards e indicadores do processo produtivo.",
    chaves: [
      "dashboard",
      "dashboard_produtividade",
      "dashboard_materia_prima",
    ],
  },

  {
    id: "pedidos",
    nome: "Pedidos",
    descricao:
      "Consulta e acompanhamento dos pedidos.",
    chaves: [
      "pedidos",
    ],
  },

  {
    id: "financeiro",
    nome: "Financeiro",
    descricao:
      "Painéis e análises financeiras.",
    chaves: [
      "financeiro",
      "financeiro_evolucao_mensal",
    ],
  },

  {
    id: "relatorios",
    nome: "Relatórios",
    descricao:
      "Central de relatórios e permissões específicas.",
    chaves: [
      "relatorios",
    ],
  },

  {
    id: "administracao",
    nome: "Administração",
    descricao:
      "Funções administrativas disponíveis para operadores.",
    chaves: [
      "importar",
    ],
  },
]);

function GerenciarUsuarios() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);

  const [telas, setTelas] = useState([]);

  const [relatorios, setRelatorios] = useState([]);

  const [permissoesPorUsuario, setPermissoesPorUsuario] =
    useState({});

  const [
    permissoesRelatoriosPorUsuario,
    setPermissoesRelatoriosPorUsuario,
  ] = useState({});

  const [loading, setLoading] = useState(true);

  const [mensagem, setMensagem] = useState({
    tipo: "",
    texto: "",
  });

  const [usuarioParaExcluir, setUsuarioParaExcluir] =
    useState(null);

  const [usuarioPermissoes, setUsuarioPermissoes] =
    useState(null);

  const [
    permissoesTemporarias,
    setPermissoesTemporarias,
  ] = useState({});

  const [
    permissoesRelatoriosTemporarias,
    setPermissoesRelatoriosTemporarias,
  ] = useState({});

  const [
    salvandoPermissoes,
    setSalvandoPermissoes,
  ] = useState(false);

  const [modalNovoUsuario, setModalNovoUsuario] =
    useState(false);

  const [emailNovoUsuario, setEmailNovoUsuario] =
    useState("");

  const [criandoUsuario, setCriandoUsuario] =
    useState(false);

  const [linkPrimeiroAcesso, setLinkPrimeiroAcesso] =
    useState("");

  const [emailUsuarioCriado, setEmailUsuarioCriado] =
    useState("");

  const [linkCopiado, setLinkCopiado] =
    useState(false);

  /* =========================================================
     LIMPAR MENSAGEM
  ========================================================= */

  useEffect(() => {
    if (!mensagem.texto) {
      return;
    }

    const timer = setTimeout(() => {
      setMensagem({
        tipo: "",
        texto: "",
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [mensagem]);

  /* =========================================================
     CARREGAR USUÁRIOS, TELAS E RELATÓRIOS
  ========================================================= */

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);

      const [
        respostaUsuarios,
        respostaTelas,
        respostaPermissoes,
        respostaRelatorios,
        respostaPermissoesRelatorios,
      ] = await Promise.all([
        supabase
          .from("perfis")
          .select("id, email, regra")
          .order("email", {
            ascending: true,
          }),

        supabase
          .from("telas_sistema")
          .select(
            "id, chave, nome, rota, ordem, ativo"
          )
          .eq("ativo", true)
          .order("ordem", {
            ascending: true,
          }),

        supabase
          .from("usuario_permissoes")
          .select(
            "usuario_id, tela_id, permitido"
          ),

        supabase
          .from("relatorios_sistema")
          .select(
            "id, chave, nome, categoria, ordem, ativo"
          )
          .eq("ativo", true)
          .order("ordem", {
            ascending: true,
          }),

        supabase
          .from("usuario_relatorio_permissoes")
          .select(
            "usuario_id, relatorio_id, permitido"
          ),
      ]);

      if (respostaUsuarios.error) {
        throw respostaUsuarios.error;
      }

      if (respostaTelas.error) {
        throw respostaTelas.error;
      }

      if (respostaPermissoes.error) {
        throw respostaPermissoes.error;
      }

      if (respostaRelatorios.error) {
        throw respostaRelatorios.error;
      }

      if (respostaPermissoesRelatorios.error) {
        throw respostaPermissoesRelatorios.error;
      }

      setUsuarios(
        respostaUsuarios.data || []
      );

      setTelas(
        respostaTelas.data || []
      );

      setRelatorios(
        respostaRelatorios.data || []
      );

      /* =====================================================
         MAPA DE PERMISSÕES DAS TELAS
      ===================================================== */

      const mapaPermissoes = {};

      for (
        const permissao of
        respostaPermissoes.data || []
      ) {
        if (
          !mapaPermissoes[
            permissao.usuario_id
          ]
        ) {
          mapaPermissoes[
            permissao.usuario_id
          ] = {};
        }

        mapaPermissoes[
          permissao.usuario_id
        ][String(permissao.tela_id)] =
          Boolean(permissao.permitido);
      }

      setPermissoesPorUsuario(
        mapaPermissoes
      );

      /* =====================================================
         MAPA DE PERMISSÕES DOS RELATÓRIOS
      ===================================================== */

      const mapaRelatorios = {};

      for (
        const permissao of
        respostaPermissoesRelatorios.data ||
        []
      ) {
        if (
          !mapaRelatorios[
            permissao.usuario_id
          ]
        ) {
          mapaRelatorios[
            permissao.usuario_id
          ] = {};
        }

        mapaRelatorios[
          permissao.usuario_id
        ][
          String(permissao.relatorio_id)
        ] = Boolean(permissao.permitido);
      }

      setPermissoesRelatoriosPorUsuario(
        mapaRelatorios
      );
    } catch (error) {
      setMensagem({
        tipo: "erro",

        texto:
          "Erro ao buscar usuários: " +
          error.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  /* =========================================================
     CADASTRAR NOVO USUÁRIO
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

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMensagem({
          tipo: "erro",
          texto: "Informe um e-mail válido.",
        });
        return;
      }

      try {
        setCriandoUsuario(true);
        setLinkCopiado(false);

        const redirectTo =
          `${window.location.origin}/definir-senha`;

        const { data, error } =
          await supabase.functions.invoke(
            "criar-usuario",
            {
              body: {
                email,
                redirectTo,
              },
            }
          );

        if (error) {
          let mensagemDetalhada = "";

          try {
            if (error.context) {
              const respostaErro =
                await error.context.json();

              mensagemDetalhada =
                respostaErro?.erro || "";
            }
          } catch {
            // Mantém a mensagem padrão abaixo.
          }

          throw new Error(
            mensagemDetalhada ||
              error.message ||
              "Não foi possível cadastrar o usuário."
          );
        }

        if (!data?.sucesso) {
          throw new Error(
            data?.erro ||
              "Não foi possível cadastrar o usuário."
          );
        }

        if (!data?.link_primeiro_acesso) {
          throw new Error(
            "O usuário foi criado, mas o link de primeiro acesso não foi retornado."
          );
        }

        setEmailUsuarioCriado(
          data?.usuario?.email || email
        );

        setLinkPrimeiroAcesso(
          data.link_primeiro_acesso
        );

        setMensagem({
          tipo: "sucesso",
          texto: "Usuário cadastrado com sucesso!",
        });

        await carregarUsuarios();
      } catch (error) {
        setMensagem({
          tipo: "erro",
          texto:
            error?.message ||
            "Não foi possível cadastrar o usuário.",
        });
      } finally {
        setCriandoUsuario(false);
      }
    },
    [emailNovoUsuario, carregarUsuarios]
  );

  const copiarLinkPrimeiroAcesso = useCallback(
    async () => {
      if (!linkPrimeiroAcesso) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          linkPrimeiroAcesso
        );

        setLinkCopiado(true);

        setTimeout(() => {
          setLinkCopiado(false);
        }, 2000);
      } catch {
        setMensagem({
          tipo: "erro",
          texto:
            "Não foi possível copiar o link automaticamente. Selecione o link e copie manualmente.",
        });
      }
    },
    [linkPrimeiroAcesso]
  );

  /* =========================================================
     ALTERAR ADMIN / OPERADOR
  ========================================================= */

  const alterarRegra = useCallback(
    async (usuarioId, novaRegra) => {
      const usuariosAnteriores =
        usuarios;

      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === usuarioId
            ? {
                ...usuario,
                regra: novaRegra,
              }
            : usuario
        )
      );

      setMensagem({
        tipo: "sucesso",
        texto:
          "Nível de acesso atualizado com sucesso!",
      });

      try {
        const { error } = await supabase
          .from("perfis")
          .update({
            regra: novaRegra,
          })
          .eq("id", usuarioId);

        if (error) {
          setUsuarios(
            usuariosAnteriores
          );

          throw error;
        }
      } catch (error) {
        setMensagem({
          tipo: "erro",

          texto:
            "Erro ao atualizar nível: " +
            error.message,
        });
      }
    },
    [usuarios]
  );

  /* =========================================================
     ABRIR MODAL DE PERMISSÕES
  ========================================================= */

  const abrirPermissoes = useCallback(
    (usuario) => {
      if (usuario.regra === "admin") {
        return;
      }

      /* -----------------------------------------------------
         TELAS
      ----------------------------------------------------- */

      const permissoesAtuais =
        permissoesPorUsuario[
          usuario.id
        ] || {};

      const permissoesModal = {};

      for (const tela of telas) {
        permissoesModal[
          String(tela.id)
        ] = Boolean(
          permissoesAtuais[
            String(tela.id)
          ]
        );
      }

      /* -----------------------------------------------------
         RELATÓRIOS
      ----------------------------------------------------- */

      const relatoriosAtuais =
        permissoesRelatoriosPorUsuario[
          usuario.id
        ] || {};

      const relatoriosModal = {};

      for (const relatorio of relatorios) {
        relatoriosModal[
          String(relatorio.id)
        ] = Boolean(
          relatoriosAtuais[
            String(relatorio.id)
          ]
        );
      }

      setUsuarioPermissoes(
        usuario
      );

      setPermissoesTemporarias(
        permissoesModal
      );

      setPermissoesRelatoriosTemporarias(
        relatoriosModal
      );
    },
    [
      permissoesPorUsuario,
      permissoesRelatoriosPorUsuario,
      telas,
      relatorios,
    ]
  );

  /* =========================================================
     MARCAR / DESMARCAR UMA TELA
  ========================================================= */

  const alterarPermissaoTemporaria =
    useCallback((telaId) => {
      const chave = String(telaId);

      setPermissoesTemporarias(
        (prev) => ({
          ...prev,

          [chave]: !prev[chave],
        })
      );
    }, []);

  /* =========================================================
     MARCAR / DESMARCAR UM RELATÓRIO
  ========================================================= */

  const alterarPermissaoRelatorio =
    useCallback((relatorioId) => {
      const chave =
        String(relatorioId);

      setPermissoesRelatoriosTemporarias(
        (prev) => ({
          ...prev,

          [chave]: !prev[chave],
        })
      );
    }, []);

  /* =========================================================
     TELAS GERENCIÁVEIS
  ========================================================= */

  const telasGerenciaveis =
    useMemo(
      () =>
        telas.filter(
          (tela) =>
            tela.chave !==
            "usuarios"
        ),
      [
        telas,
      ]
    );

  /* =========================================================
     TELAS AGRUPADAS POR MÓDULO
  ========================================================= */

  const telasPorModulo =
    useMemo(
      () =>
        MODULOS_PERMISSOES
          .map(
            (modulo) => {
              const itens =
                modulo.chaves
                  .map(
                    (chave) =>
                      telasGerenciaveis.find(
                        (tela) =>
                          tela.chave ===
                          chave
                      )
                  )
                  .filter(Boolean);

              return {
                ...modulo,
                telas: itens,
              };
            }
          )
          .filter(
            (modulo) =>
              modulo.telas.length >
              0
          ),
      [
        telasGerenciaveis,
      ]
    );

  /* =========================================================
     STATUS DO MÓDULO
  ========================================================= */

  const obterStatusModulo =
    useCallback(
      (modulo) => {
        const total =
          modulo.telas.length;

        const permitidas =
          modulo.telas.filter(
            (tela) =>
              Boolean(
                permissoesTemporarias[
                  String(tela.id)
                ]
              )
          ).length;

        return {
          total,
          permitidas,

          completo:
            total > 0 &&
            permitidas === total,

          parcial:
            permitidas > 0 &&
            permitidas < total,
        };
      },
      [
        permissoesTemporarias,
      ]
    );

  /* =========================================================
     LIBERAR / BLOQUEAR UM MÓDULO
  ========================================================= */

  const definirPermissaoModulo =
    useCallback(
      (
        modulo,
        permitido
      ) => {
        setPermissoesTemporarias(
          (prev) => {
            const proximo = {
              ...prev,
            };

            for (
              const tela of
              modulo.telas
            ) {
              proximo[
                String(tela.id)
              ] = permitido;
            }

            return proximo;
          }
        );
      },
      []
    );

  /* =========================================================
     LIBERAR TODAS AS TELAS
  ========================================================= */

  const marcarTodasTelas =
    useCallback(() => {
      setPermissoesTemporarias(
        (prev) => {
          const novasPermissoes = {
            ...prev,
          };

          for (
            const tela of
            telasGerenciaveis
          ) {
            novasPermissoes[
              String(tela.id)
            ] = true;
          }

          return novasPermissoes;
        }
      );
    }, [telasGerenciaveis]);

  /* =========================================================
     BLOQUEAR TODAS AS TELAS
  ========================================================= */

  const desmarcarTodasTelas =
    useCallback(() => {
      setPermissoesTemporarias(
        (prev) => {
          const novasPermissoes = {
            ...prev,
          };

          for (
            const tela of
            telasGerenciaveis
          ) {
            novasPermissoes[
              String(tela.id)
            ] = false;
          }

          return novasPermissoes;
        }
      );
    }, [telasGerenciaveis]);

  /* =========================================================
     LIBERAR TODOS OS RELATÓRIOS
  ========================================================= */

  const marcarTodosRelatorios =
    useCallback(() => {
      const novasPermissoes = {};

      for (
        const relatorio of relatorios
      ) {
        novasPermissoes[
          String(relatorio.id)
        ] = true;
      }

      setPermissoesRelatoriosTemporarias(
        novasPermissoes
      );
    }, [relatorios]);

  /* =========================================================
     BLOQUEAR TODOS OS RELATÓRIOS
  ========================================================= */

  const desmarcarTodosRelatorios =
    useCallback(() => {
      const novasPermissoes = {};

      for (
        const relatorio of relatorios
      ) {
        novasPermissoes[
          String(relatorio.id)
        ] = false;
      }

      setPermissoesRelatoriosTemporarias(
        novasPermissoes
      );
    }, [relatorios]);

  /* =========================================================
     SALVAR PERMISSÕES
  ========================================================= */

  const salvarPermissoes =
    useCallback(async () => {
      if (!usuarioPermissoes) {
        return;
      }

      try {
        setSalvandoPermissoes(
          true
        );

        /* ---------------------------------------------------
           TELAS
        --------------------------------------------------- */

        const registrosTelas =
          telas.map((tela) => ({
            usuario_id:
              usuarioPermissoes.id,

            tela_id: tela.id,

            permitido: Boolean(
              permissoesTemporarias[
                String(tela.id)
              ]
            ),

            updated_at:
              new Date().toISOString(),
          }));

        /* ---------------------------------------------------
           RELATÓRIOS
        --------------------------------------------------- */

        const registrosRelatorios =
          relatorios.map(
            (relatorio) => ({
              usuario_id:
                usuarioPermissoes.id,

              relatorio_id:
                relatorio.id,

              permitido: Boolean(
                permissoesRelatoriosTemporarias[
                  String(relatorio.id)
                ]
              ),

              updated_at:
                new Date().toISOString(),
            })
          );

        const [
          respostaTelas,
          respostaRelatorios,
        ] = await Promise.all([
          supabase
            .from(
              "usuario_permissoes"
            )
            .upsert(
              registrosTelas,
              {
                onConflict:
                  "usuario_id,tela_id",
              }
            ),

          supabase
            .from(
              "usuario_relatorio_permissoes"
            )
            .upsert(
              registrosRelatorios,
              {
                onConflict:
                  "usuario_id,relatorio_id",
              }
            ),
        ]);

        if (respostaTelas.error) {
          throw respostaTelas.error;
        }

        if (
          respostaRelatorios.error
        ) {
          throw respostaRelatorios.error;
        }

        setPermissoesPorUsuario(
          (prev) => ({
            ...prev,

            [usuarioPermissoes.id]: {
              ...permissoesTemporarias,
            },
          })
        );

        setPermissoesRelatoriosPorUsuario(
          (prev) => ({
            ...prev,

            [usuarioPermissoes.id]: {
              ...permissoesRelatoriosTemporarias,
            },
          })
        );

        setMensagem({
          tipo: "sucesso",

          texto:
            `Permissões de ${usuarioPermissoes.email} atualizadas com sucesso!`,
        });

        fecharModalPermissoes();
      } catch (error) {
        setMensagem({
          tipo: "erro",

          texto:
            "Erro ao salvar permissões: " +
            error.message,
        });
      } finally {
        setSalvandoPermissoes(
          false
        );
      }
    }, [
      usuarioPermissoes,
      telas,
      relatorios,
      permissoesTemporarias,
      permissoesRelatoriosTemporarias,
    ]);

  /* =========================================================
     FECHAR MODAL
  ========================================================= */

  function fecharModalPermissoes() {
    setUsuarioPermissoes(null);

    setPermissoesTemporarias(
      {}
    );

    setPermissoesRelatoriosTemporarias(
      {}
    );
  }

  /* =========================================================
     EXCLUSÃO
  ========================================================= */

  const confirmarExclusao =
    useCallback(async () => {
      if (!usuarioParaExcluir) {
        return;
      }

      const { id: usuarioId } =
        usuarioParaExcluir;

      const usuariosAnteriores =
        usuarios;

      setUsuarioParaExcluir(null);

      setUsuarios((prev) =>
        prev.filter(
          (usuario) =>
            usuario.id !== usuarioId
        )
      );

      setMensagem({
        tipo: "sucesso",

        texto:
          "Usuário excluído completamente com sucesso!",
      });

      try {
        const { error } =
          await supabase.rpc(
            "apagar_usuario_completo",
            {
              usuario_id:
                usuarioId,
            }
          );

        if (error) {
          setUsuarios(
            usuariosAnteriores
          );

          throw error;
        }

        setPermissoesPorUsuario(
          (prev) => {
            const novoMapa = {
              ...prev,
            };

            delete novoMapa[
              usuarioId
            ];

            return novoMapa;
          }
        );

        setPermissoesRelatoriosPorUsuario(
          (prev) => {
            const novoMapa = {
              ...prev,
            };

            delete novoMapa[
              usuarioId
            ];

            return novoMapa;
          }
        );
      } catch (error) {
        setMensagem({
          tipo: "erro",

          texto:
            "Erro ao excluir usuário: " +
            error.message,
        });
      }
    }, [
      usuarioParaExcluir,
      usuarios,
    ]);

  /* =========================================================
     CONTAR TELAS
  ========================================================= */

  const contarPermissoes =
    useCallback(
      (usuarioId) => {
        const permissoes =
          permissoesPorUsuario[
            usuarioId
          ] || {};

        return telasGerenciaveis.filter(
          (tela) =>
            permissoes[
              String(tela.id)
            ] === true
        ).length;
      },
      [
        permissoesPorUsuario,
        telasGerenciaveis,
      ]
    );

  /* =========================================================
     DESCOBRIR A TELA RELATÓRIOS
  ========================================================= */

  const telaRelatorios =
    useMemo(() => {
      return telas.find(
        (tela) =>
          tela.chave ===
          "relatorios"
      );
    }, [telas]);

  /* =========================================================
     RELATÓRIOS POR CATEGORIA
  ========================================================= */

  const relatoriosPorCategoria =
    useMemo(() => {
      const grupos = {};

      for (
        const relatorio of relatorios
      ) {
        const categoria =
          relatorio.categoria ||
          "Outros";

        if (!grupos[categoria]) {
          grupos[categoria] = [];
        }

        grupos[categoria].push(
          relatorio
        );
      }

      return grupos;
    }, [relatorios]);

  /* =========================================================
     TABELA
  ========================================================= */

  const linhasTabela =
    useMemo(() => {
      if (
        usuarios.length === 0
      ) {
        return (
          <tr>
            <td
              colSpan="5"
              className="tabela-vazia"
            >
              Nenhum usuário
              cadastrado encontrado.
            </td>
          </tr>
        );
      }

      return usuarios.map(
        (user) => {
          const totalPermitido =
            contarPermissoes(
              user.id
            );

          return (
            <tr key={user.id}>
              <td className="user-email-col">
                {user.email}
              </td>

              <td>
                <span
                  className={`badge-role ${user.regra}`}
                >
                  {user.regra ===
                  "admin"
                    ? "Administrador"
                    : "Operador"}
                </span>
              </td>

              <td className="col-centralizada">
                {user.regra ===
                "admin" ? (
                  <div className="acesso-total-admin">
                    Acesso total
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-gerenciar-permissoes"
                    onClick={() =>
                      abrirPermissoes(
                        user
                      )
                    }
                  >
                    <FiSettings />

                    <span>
                      Configurar acessos
                    </span>

                    <span className="contador-permissoes">
                      {
                        totalPermitido
                      }
                      /{telasGerenciaveis.length}
                    </span>
                  </button>
                )}
              </td>

              <td className="col-centralizada">
                {user.regra ===
                "admin" ? (
                  <button
                    className="btn-change-role op"
                    onClick={() =>
                      alterarRegra(
                        user.id,
                        "operador"
                      )
                    }
                  >
                    Rebaixar para
                    Operador
                  </button>
                ) : (
                  <button
                    className="btn-change-role adm"
                    onClick={() =>
                      alterarRegra(
                        user.id,
                        "admin"
                      )
                    }
                  >
                    Promover a Admin
                  </button>
                )}
              </td>

              <td className="col-centralizada">
                <button
                  className="btn-delete-user"
                  onClick={() =>
                    setUsuarioParaExcluir(
                      user
                    )
                  }
                >
                  Excluir
                </button>
              </td>
            </tr>
          );
        }
      );
    }, [
      usuarios,
      telasGerenciaveis,
      contarPermissoes,
      abrirPermissoes,
      alterarRegra,
    ]);

  /* =========================================================
     RELATÓRIOS ESTÃO LIBERADOS?
  ========================================================= */

  const relatoriosLiberados =
    telaRelatorios
      ? Boolean(
          permissoesTemporarias[
            String(
              telaRelatorios.id
            )
          ]
        )
      : false;

  return (
    <div className="gerenciar-usuarios-container">
      <button
        className="btn-voltar-home"
        onClick={() =>
          navigate("/")
        }
      >
        <FiArrowLeft />

        <span>
          Página Inicial
        </span>
      </button>

      <div className="admin-header-block admin-header-com-acoes">
        <div>
          <h2>
            Gerenciamento de Usuários
          </h2>

          <p>
            Altere os níveis de acesso e
            escolha quais módulos, telas e
            relatórios cada colaborador
            poderá acessar.
          </p>
        </div>

        <button
          type="button"
          className="btn-novo-usuario"
          onClick={abrirNovoUsuario}
        >
          <FiUserPlus />
          <span>Cadastrar usuário</span>
        </button>
      </div>

      {mensagem.texto && (
        <div
          className={`alert-message ${mensagem.tipo}`}
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
        <div className="table-responsive">
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>E-mail</th>

                <th>
                  Perfil Atual
                </th>

                <th className="col-centralizada">
                  Acessos Liberados
                </th>

                <th className="col-centralizada">
                  Nível de Acesso
                </th>

                <th className="col-centralizada">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {linhasTabela}
            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          MODAL NOVO USUÁRIO
      ====================================================== */}

      {modalNovoUsuario && (
        <div className="modal-overlay">
          <div className="modal-content modal-novo-usuario">
            <div className="modal-novo-usuario-header">
              <div className="modal-permissoes-icon">
                <FiUserPlus />
              </div>

              <div>
                <h3>Cadastrar usuário</h3>
                <p>
                  Cadastre o e-mail do colaborador.
                  Ele receberá um link para definir a própria senha.
                </p>
              </div>

              <button
                type="button"
                className="btn-fechar-modal-usuario"
                onClick={fecharNovoUsuario}
                disabled={criandoUsuario}
                aria-label="Fechar"
              >
                <FiX />
              </button>
            </div>

            {!linkPrimeiroAcesso ? (
              <form
                onSubmit={cadastrarNovoUsuario}
                className="form-novo-usuario"
              >
                <label className="campo-novo-usuario">
                  <span>E-mail do usuário</span>

                  <input
                    type="email"
                    value={emailNovoUsuario}
                    onChange={(event) =>
                      setEmailNovoUsuario(
                        event.target.value
                      )
                    }
                    placeholder="nome@empresa.com"
                    autoComplete="email"
                    disabled={criandoUsuario}
                    required
                    autoFocus
                  />
                </label>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancelar"
                    onClick={fecharNovoUsuario}
                    disabled={criandoUsuario}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-modal-salvar-permissoes"
                    disabled={criandoUsuario}
                  >
                    {criandoUsuario
                      ? "Cadastrando..."
                      : "Cadastrar usuário"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="usuario-criado-sucesso">
                <strong>
                  Usuário cadastrado
                </strong>

                <span>
                  {emailUsuarioCriado}
                </span>

                <p>
                  Envie o link abaixo para o usuário
                  definir a senha do primeiro acesso.
                </p>

                <div className="bloco-link-primeiro-acesso">
                  <input
                    type="text"
                    value={linkPrimeiroAcesso}
                    readOnly
                    onFocus={(event) =>
                      event.target.select()
                    }
                  />

                  <button
                    type="button"
                    onClick={copiarLinkPrimeiroAcesso}
                  >
                    <FiCopy />
                    {linkCopiado
                      ? "Copiado!"
                      : "Copiar link"}
                  </button>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-salvar-permissoes"
                    onClick={fecharNovoUsuario}
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL PERMISSÕES
      ====================================================== */}

      {usuarioPermissoes && (
        <div className="modal-overlay">
          <div className="modal-content modal-permissoes">
            <div className="modal-permissoes-header">
              <div className="modal-permissoes-icon">
                <FiSettings />
              </div>

              <div>
                <h3>
                  Permissões de acesso
                </h3>

                <p>
                  {
                    usuarioPermissoes.email
                  }
                </p>
              </div>
            </div>

            <div className="acoes-permissoes-rapidas">
              <button
                type="button"
                onClick={
                  marcarTodasTelas
                }
              >
                Liberar todas
              </button>

              <button
                type="button"
                onClick={
                  desmarcarTodasTelas
                }
              >
                Bloquear todas
              </button>
            </div>

            <div className="lista-permissoes">
              <div className="titulo-grupo-permissoes">
                Acesso por módulo
              </div>

              <div className="permissoes-modulos-lista">
                {telasPorModulo.map(
                  (modulo) => {
                    const status =
                      obterStatusModulo(
                        modulo
                      );

                    return (
                      <section
                        key={modulo.id}
                        className={`permissao-modulo-card ${
                          status.completo
                            ? "ativo"
                            : status.parcial
                              ? "parcial"
                              : ""
                        }`}
                      >
                        <div className="permissao-modulo-header">
                          <div className="permissao-modulo-titulo">
                            <strong>
                              {modulo.nome}
                            </strong>

                            <span>
                              {
                                modulo.descricao
                              }
                            </span>
                          </div>

                          <div className="permissao-modulo-acoes">
                            <span className="permissao-modulo-contador">
                              {
                                status.permitidas
                              }
                              /
                              {
                                status.total
                              }
                            </span>

                            <button
                              type="button"
                              className={
                                status.completo
                                  ? "btn-modulo-bloquear"
                                  : "btn-modulo-liberar"
                              }
                              onClick={() =>
                                definirPermissaoModulo(
                                  modulo,
                                  !status.completo
                                )
                              }
                            >
                              {status.completo
                                ? "Bloquear módulo"
                                : "Liberar módulo"}
                            </button>
                          </div>
                        </div>

                        <div className="permissao-modulo-telas">
                          {modulo.telas.map(
                            (tela) => {
                              const marcado =
                                Boolean(
                                  permissoesTemporarias[
                                    String(
                                      tela.id
                                    )
                                  ]
                                );

                              return (
                                <label
                                  key={
                                    tela.id
                                  }
                                  className={`item-permissao item-permissao-modulo ${
                                    marcado
                                      ? "ativo"
                                      : ""
                                  }`}
                                >
                                  <div className="item-permissao-info">
                                    <strong>
                                      {
                                        tela.nome
                                      }
                                    </strong>

                                    <span>
                                      {
                                        tela.rota
                                      }
                                    </span>
                                  </div>

                                  <input
                                    type="checkbox"
                                    checked={
                                      marcado
                                    }
                                    onChange={() =>
                                      alterarPermissaoTemporaria(
                                        tela.id
                                      )
                                    }
                                  />
                                </label>
                              );
                            }
                          )}
                        </div>

                        {modulo.id ===
                          "relatorios" &&
                          relatoriosLiberados && (
                            <div className="bloco-permissoes-relatorios bloco-relatorios-dentro-modulo">
                              <div className="cabecalho-permissoes-relatorios">
                                <div>
                                  <div className="titulo-relatorios-permissoes">
                                    <FiFileText />

                                    Relatórios permitidos
                                  </div>

                                  <p>
                                    Escolha quais
                                    relatórios este
                                    usuário poderá
                                    visualizar.
                                  </p>
                                </div>

                                <div className="acoes-relatorios-permissoes">
                                  <button
                                    type="button"
                                    onClick={
                                      marcarTodosRelatorios
                                    }
                                  >
                                    Liberar todos
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      desmarcarTodosRelatorios
                                    }
                                  >
                                    Bloquear todos
                                  </button>
                                </div>
                              </div>

                              {Object.entries(
                                relatoriosPorCategoria
                              ).map(
                                ([
                                  categoria,
                                  itens,
                                ]) => (
                                  <div
                                    key={
                                      categoria
                                    }
                                    className="grupo-relatorios-permissoes"
                                  >
                                    <div className="categoria-relatorios-permissoes">
                                      {
                                        categoria
                                      }
                                    </div>

                                    {itens.map(
                                      (
                                        relatorio
                                      ) => {
                                        const marcado =
                                          Boolean(
                                            permissoesRelatoriosTemporarias[
                                              String(
                                                relatorio.id
                                              )
                                            ]
                                          );

                                        return (
                                          <label
                                            key={
                                              relatorio.id
                                            }
                                            className={`item-permissao item-permissao-relatorio ${
                                              marcado
                                                ? "ativo"
                                                : ""
                                            }`}
                                          >
                                            <div className="item-permissao-info">
                                              <strong>
                                                {
                                                  relatorio.nome
                                                }
                                              </strong>
                                            </div>

                                            <input
                                              type="checkbox"
                                              checked={
                                                marcado
                                              }
                                              onChange={() =>
                                                alterarPermissaoRelatorio(
                                                  relatorio.id
                                                )
                                              }
                                            />
                                          </label>
                                        );
                                      }
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </section>
                    );
                  }
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-modal-cancelar"
                disabled={
                  salvandoPermissoes
                }
                onClick={
                  fecharModalPermissoes
                }
              >
                Cancelar
              </button>

              <button
                className="btn-modal-salvar-permissoes"
                disabled={
                  salvandoPermissoes
                }
                onClick={
                  salvarPermissoes
                }
              >
                {salvandoPermissoes
                  ? "Salvando..."
                  : "Salvar permissões"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MODAL EXCLUSÃO
      ====================================================== */}

      {usuarioParaExcluir && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon-alert">
              <FiAlertTriangle />
            </div>

            <h3>
              Confirmar Exclusão
            </h3>

            <p>
              Tem certeza que deseja
              excluir completamente o
              acesso de{" "}
              <strong>
                {
                  usuarioParaExcluir.email
                }
              </strong>
              ? Esta ação não poderá ser
              desfeita.
            </p>

            <div className="modal-actions">
              <button
                className="btn-modal-cancelar"
                onClick={() =>
                  setUsuarioParaExcluir(
                    null
                  )
                }
              >
                Cancelar
              </button>

              <button
                className="btn-modal-confirmar"
                onClick={
                  confirmarExclusao
                }
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GerenciarUsuarios;