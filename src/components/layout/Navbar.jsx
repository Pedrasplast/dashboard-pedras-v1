import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouterState } from "@tanstack/react-router";

import {
  Bell,
  ChevronDown,
  DollarSign,
  Factory,
  FileText,
  Gauge,
  Home,
  LogIn,
  LogOut,
  ShoppingCart,
  Upload,
  Users,
  X,
} from "lucide-react";

import { usePermissoes } from "@/hooks/usePermissoes";
import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient";

import "./Navbar.css";


/* =========================================================
   ITENS DE NAVEGAÇÃO
========================================================= */

const NAVIGATION_ITEMS = Object.freeze([
  {
    label: "Início",
    shortLabel: "Início",
    path: "/",
    icon: Home,
    permissao: null,
  },
  {
    label: "Produção",
    shortLabel: "Produção",
    path: "/dashboard",
    icon: Factory,
    permissao: "dashboard",
  },
  {
    label: "Produtividade",
    shortLabel: "Eficiência",
    path: "/dashboard-produtividade",
    icon: Gauge,
    permissao: "dashboard_produtividade",
  },
  {
    label: "Pedidos",
    shortLabel: "Pedidos",
    path: "/pedidos",
    icon: ShoppingCart,
    permissao: "pedidos",
  },
  {
    label: "Financeiro",
    shortLabel: "Financeiro",
    path: "/financeiro",
    icon: DollarSign,
    permissao: "financeiro",
  },
  {
    label: "Relatórios",
    shortLabel: "Relatórios",
    path: "/relatorios",
    icon: FileText,
    permissao: "relatorios",
  },
]);


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarCaminho(path) {
  const caminho = String(
    path || "/"
  ).trim();

  return caminho === "/"
    ? "/"
    : caminho.replace(/\/+$/, "");
}


function obterNomeUsuario(email) {
  if (!email) {
    return "";
  }

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}


function obterIniciais(nome) {
  if (!nome) {
    return "US";
  }

  const palavras = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (palavras.length === 1) {
    return palavras[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${palavras[0][0]}${palavras.at(-1)[0]}`
    .toUpperCase();
}


/* =========================================================
   NAVBAR
========================================================= */

function Navbar({
  user,
  isAdmin,
}) {
  const navigate = useNavigate();

  const menuRef = useRef(null);

  const alertaTimeoutRef =
    useRef(null);


  /* =======================================================
     MENU DO USUÁRIO
  ======================================================= */

  const [
    userMenuOpen,
    setUserMenuOpen,
  ] = useState(false);


  /* =======================================================
     NOTIFICAÇÕES DE PEDIDOS
  ======================================================= */

  const [
    pedidosNaoLidos,
    setPedidosNaoLidos,
  ] = useState(0);


  const [
    ultimaNotificacaoPedido,
    setUltimaNotificacaoPedido,
  ] = useState(null);


  const [
    mostrarAlertaPedido,
    setMostrarAlertaPedido,
  ] = useState(false);


  /* =======================================================
     PERMISSÕES
  ======================================================= */

  const {
    podeAcessarTela,
    loadingPermissoes,
  } = usePermissoes();


  /* =======================================================
     ROTA ATUAL
  ======================================================= */

  const pathname = useRouterState({
    select: (state) =>
      state.location.pathname,
  });


  const currentPath = useMemo(
    () =>
      normalizarCaminho(
        pathname
      ),
    [pathname]
  );


  /* =======================================================
     USUÁRIO
  ======================================================= */

  const userName = useMemo(
    () =>
      obterNomeUsuario(
        user?.email
      ),
    [user?.email]
  );


  const userInitials = useMemo(
    () =>
      obterIniciais(
        userName
      ),
    [userName]
  );


  /* =======================================================
     PODE ACESSAR PEDIDOS
  ======================================================= */

  const podeAcessarPedidos =
    useMemo(() => {
      if (!user) {
        return false;
      }

      if (isAdmin) {
        return true;
      }

      if (loadingPermissoes) {
        return false;
      }

      return podeAcessarTela(
        "pedidos"
      );
    }, [
      user,
      isAdmin,
      loadingPermissoes,
      podeAcessarTela,
    ]);


  /* =======================================================
     ITENS VISÍVEIS
  ======================================================= */

  const navigationItemsVisiveis =
    useMemo(() => {
      if (!user) {
        return [];
      }

      /*
       * ADMIN vê todos os itens.
       */
      if (isAdmin) {
        return NAVIGATION_ITEMS;
      }

      /*
       * Enquanto as permissões do OPERADOR
       * carregam, exibimos apenas Início.
       */
      if (loadingPermissoes) {
        return NAVIGATION_ITEMS.filter(
          (item) =>
            !item.permissao
        );
      }

      return NAVIGATION_ITEMS.filter(
        (item) => {
          if (!item.permissao) {
            return true;
          }

          return podeAcessarTela(
            item.permissao
          );
        }
      );
    }, [
      user,
      isAdmin,
      loadingPermissoes,
      podeAcessarTela,
    ]);


  /* =======================================================
     IMPORTAÇÃO
  ======================================================= */

  const podeImportar = useMemo(
    () => {
      if (!user) {
        return false;
      }

      if (isAdmin) {
        return true;
      }

      if (loadingPermissoes) {
        return false;
      }

      return podeAcessarTela(
        "importar"
      );
    },
    [
      user,
      isAdmin,
      loadingPermissoes,
      podeAcessarTela,
    ]
  );


  /* =======================================================
     BUSCAR QUANTIDADE DE PEDIDOS NOVOS
  ======================================================= */

  const atualizarQuantidadePedidosNovos =
    useCallback(
      async () => {
        if (
          !user ||
          !podeAcessarPedidos
        ) {
          setPedidosNaoLidos(0);

          return;
        }

        try {
          const {
            data,
            error,
          } =
            await supabase.rpc(
              "contar_notificacoes_pedidos_nao_lidas"
            );

          if (error) {
            console.error(
              "Erro ao consultar novos pedidos:",
              error
            );

            return;
          }

          const quantidade =
            Number(data ?? 0);

          setPedidosNaoLidos(
            Number.isFinite(
              quantidade
            )
              ? quantidade
              : 0
          );
        } catch (error) {
          console.error(
            "Erro inesperado ao consultar novos pedidos:",
            error
          );
        }
      },
      [
        user,
        podeAcessarPedidos,
      ]
    );


  /* =======================================================
     CARREGAR CONTADOR INICIAL
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      !podeAcessarPedidos
    ) {
      setPedidosNaoLidos(0);

      return;
    }

    atualizarQuantidadePedidosNovos();
  }, [
    user,
    podeAcessarPedidos,
    atualizarQuantidadePedidosNovos,
  ]);


  /* =======================================================
     REALTIME - NOVOS PEDIDOS
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      !podeAcessarPedidos
    ) {
      return undefined;
    }


    const canal =
      supabase
        .channel(
          `navbar-pedidos-${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "pedidos_notificacoes",
          },
          (payload) => {
            const notificacao =
              payload?.new;


            if (
              !notificacao ||
              notificacao.notificar !==
                true
            ) {
              return;
            }


            /*
             * Atualiza o contador.
             */
            atualizarQuantidadePedidosNovos();


            /*
             * Prepara o alerta visual.
             */
            setUltimaNotificacaoPedido({
              id:
                notificacao.id,

              codigoPedidoOmie:
                notificacao
                  .codigo_pedido_omie,

              numeroPedido:
                notificacao
                  .numero_pedido,

              cliente:
                notificacao
                  .cliente,

              vendedor:
                notificacao
                  .vendedor,
            });


            setMostrarAlertaPedido(
              true
            );


            /*
             * Reinicia o tempo do aviso.
             */
            if (
              alertaTimeoutRef.current
            ) {
              window.clearTimeout(
                alertaTimeoutRef.current
              );
            }


            alertaTimeoutRef.current =
              window.setTimeout(
                () => {
                  setMostrarAlertaPedido(
                    false
                  );
                },
                10000
              );
          }
        )
        .subscribe();


    return () => {
      if (
        alertaTimeoutRef.current
      ) {
        window.clearTimeout(
          alertaTimeoutRef.current
        );
      }

      supabase.removeChannel(
        canal
      );
    };
  }, [
    user,
    podeAcessarPedidos,
    atualizarQuantidadePedidosNovos,
  ]);


  /* =======================================================
     ATUALIZAÇÃO IMEDIATA PELO MÓDULO PEDIDOS

     O PedidosPage dispara este evento quando
     o usuário clica em um pedido marcado como NOVO.

     Assim o contador da Navbar muda imediatamente.
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      !podeAcessarPedidos
    ) {
      return undefined;
    }


    const atualizarContador =
      () => {
        atualizarQuantidadePedidosNovos();
      };


    window.addEventListener(
      "pedidos-notificacoes-atualizadas",
      atualizarContador
    );


    return () => {
      window.removeEventListener(
        "pedidos-notificacoes-atualizadas",
        atualizarContador
      );
    };
  }, [
    user,
    podeAcessarPedidos,
    atualizarQuantidadePedidosNovos,
  ]);


  /* =======================================================
     SEGURANÇA EXTRA

     Mesmo com Realtime, atualizamos o contador
     periodicamente.

     Isso cobre:
     - perda momentânea da conexão;
     - computador voltando da suspensão;
     - troca de rede;
     - Realtime temporariamente indisponível.
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      !podeAcessarPedidos
    ) {
      return undefined;
    }


    const intervalo =
      window.setInterval(
        () => {
          atualizarQuantidadePedidosNovos();
        },
        60_000
      );


    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    user,
    podeAcessarPedidos,
    atualizarQuantidadePedidosNovos,
  ]);


  /* =======================================================
     QUANDO A ABA VOLTA A FICAR ATIVA
  ======================================================= */

  useEffect(() => {
    if (
      !user ||
      !podeAcessarPedidos
    ) {
      return undefined;
    }


    const verificarAoVoltar =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          atualizarQuantidadePedidosNovos();
        }
      };


    document.addEventListener(
      "visibilitychange",
      verificarAoVoltar
    );


    return () => {
      document.removeEventListener(
        "visibilitychange",
        verificarAoVoltar
      );
    };
  }, [
    user,
    podeAcessarPedidos,
    atualizarQuantidadePedidosNovos,
  ]);


  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const goTo = useCallback(
    (path) => {
      setUserMenuOpen(false);

      navigate(
        normalizarCaminho(
          path
        )
      );
    },
    [navigate]
  );


  /* =======================================================
     ABRIR PEDIDOS PELO ALERTA
  ======================================================= */

  const abrirPedidosPeloAlerta =
    useCallback(() => {
      setMostrarAlertaPedido(
        false
      );

      goTo("/pedidos");
    }, [
      goTo,
    ]);


  /* =======================================================
     FECHAR ALERTA
  ======================================================= */

  const fecharAlertaPedido =
    useCallback(
      (event) => {
        event.stopPropagation();

        setMostrarAlertaPedido(
          false
        );

        if (
          alertaTimeoutRef.current
        ) {
          window.clearTimeout(
            alertaTimeoutRef.current
          );

          alertaTimeoutRef.current =
            null;
        }
      },
      []
    );


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    useCallback(
      async () => {
        setUserMenuOpen(false);

        if (
          typeof window !==
          "undefined"
        ) {
          window.localStorage
            .removeItem(
              "expiracao_login"
            );
        }

        try {
          const {
            error,
          } =
            await supabase.auth
              .signOut();

          if (error) {
            console.error(
              "Erro ao encerrar a sessão:",
              error
            );
          }
        } catch (error) {
          console.error(
            "Erro inesperado ao encerrar a sessão:",
            error
          );
        } finally {
          navigate("/");
        }
      },
      [navigate]
    );


  /* =======================================================
     MENU DO USUÁRIO
  ======================================================= */

  const toggleUserMenu =
    useCallback(() => {
      setUserMenuOpen(
        (aberto) =>
          !aberto
      );
    }, []);


  /* =======================================================
     FECHAR MENU
  ======================================================= */

  useEffect(() => {
    if (
      !userMenuOpen ||
      typeof document ===
        "undefined"
    ) {
      return undefined;
    }

    const fecharAoClicarFora =
      (event) => {
        if (
          menuRef.current &&
          !menuRef.current.contains(
            event.target
          )
        ) {
          setUserMenuOpen(
            false
          );
        }
      };

    const fecharComEscape =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          setUserMenuOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    document.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );

      document.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [userMenuOpen]);


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <header className="main-navbar">
        <div className="navbar-container">

          {/* ===============================================
              LOGO
          =============================================== */}

          <button
            type="button"
            className="navbar-brand"
            onClick={() =>
              goTo("/")
            }
            aria-label="Ir para o início"
          >
            <img
              src="/Logo_Pedrasplast.png"
              alt="Pedrasplast"
              className="brand-logo-img"
            />
          </button>


          {/* ===============================================
              NAVEGAÇÃO PRINCIPAL
          =============================================== */}

          {user && (
            <nav
              className="navbar-navigation"
              aria-label="Navegação principal"
            >
              {navigationItemsVisiveis.map(
                ({
                  label,
                  shortLabel,
                  path,
                  icon: Icon,
                }) => {
                  const active =
                    currentPath ===
                    normalizarCaminho(
                      path
                    );


                  const ehPedidos =
                    path ===
                    "/pedidos";


                  return (
                    <button
                      key={path}
                      type="button"
                      className={
                        active
                          ? "navbar-navigation-link active"
                          : "navbar-navigation-link"
                      }
                      onClick={() =>
                        goTo(path)
                      }
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                    >
                      <span className="navbar-navigation-icon">
                        <Icon
                          size={18}
                          strokeWidth={2}
                          aria-hidden="true"
                        />

                        {ehPedidos &&
                          pedidosNaoLidos >
                            0 && (
                            <span
                              className="navbar-pedidos-badge-mobile"
                              aria-label={`${pedidosNaoLidos} pedido(s) novo(s)`}
                            >
                              {pedidosNaoLidos >
                              99
                                ? "99+"
                                : pedidosNaoLidos}
                            </span>
                          )}
                      </span>


                      <span className="navbar-label-desktop">
                        {label}
                      </span>


                      <span className="navbar-label-mobile">
                        {shortLabel}
                      </span>


                      {ehPedidos &&
                        pedidosNaoLidos >
                          0 && (
                          <span
                            className="navbar-pedidos-badge"
                            aria-label={`${pedidosNaoLidos} pedido(s) novo(s)`}
                          >
                            {pedidosNaoLidos >
                            99
                              ? "99+"
                              : pedidosNaoLidos}
                          </span>
                        )}

                    </button>
                  );
                }
              )}
            </nav>
          )}


          {/* ===============================================
              AUTENTICAÇÃO
          =============================================== */}

          <div className="navbar-auth-section">

            {user ? (
              <div className="navbar-user-controls">

                {/* =========================================
                    ÁREA DO USUÁRIO
                ========================================= */}

                <div
                  ref={menuRef}
                  className="navbar-user-area"
                >
                  <button
                    type="button"
                    className={
                      userMenuOpen
                        ? "navbar-user-trigger open"
                        : "navbar-user-trigger"
                    }
                    onClick={
                      toggleUserMenu
                    }
                    aria-expanded={
                      userMenuOpen
                    }
                    aria-haspopup="menu"
                    aria-label="Abrir menu do usuário"
                  >
                    <span className="user-avatar">
                      {userInitials}
                    </span>

                    <span className="user-information">
                      <strong className="user-name">
                        {userName}
                      </strong>

                      <span className="user-role">
                        {isAdmin
                          ? "Administrador"
                          : "Operador"}
                      </span>
                    </span>

                    <ChevronDown
                      size={17}
                      strokeWidth={2}
                      className={
                        userMenuOpen
                          ? "user-menu-arrow open"
                          : "user-menu-arrow"
                      }
                      aria-hidden="true"
                    />
                  </button>


                  {/* =======================================
                      MENU SUSPENSO
                  ======================================= */}

                  {userMenuOpen && (
                    <div
                      className="navbar-user-menu"
                      role="menu"
                    >

                      {/* USUÁRIO */}

                      <div className="user-menu-header">
                        <span className="user-menu-avatar">
                          {userInitials}
                        </span>

                        <div>
                          <strong>
                            {userName}
                          </strong>

                          <span>
                            {user.email}
                          </span>
                        </div>
                      </div>


                      <div className="user-menu-divider" />


                      {/* INÍCIO */}

                      <button
                        type="button"
                        className="user-menu-item"
                        onClick={() =>
                          goTo("/")
                        }
                        role="menuitem"
                      >
                        <Home
                          size={17}
                          aria-hidden="true"
                        />

                        Página inicial
                      </button>


                      {/* IMPORTAR */}

                      {podeImportar && (
                        <button
                          type="button"
                          className="user-menu-item"
                          onClick={() =>
                            goTo(
                              "/importar"
                            )
                          }
                          role="menuitem"
                        >
                          <Upload
                            size={17}
                            aria-hidden="true"
                          />

                          Importar dados
                        </button>
                      )}


                      {/* GERENCIAR USUÁRIOS */}

                      {isAdmin && (
                        <button
                          type="button"
                          className="user-menu-item"
                          onClick={() =>
                            goTo(
                              "/usuarios"
                            )
                          }
                          role="menuitem"
                        >
                          <Users
                            size={17}
                            aria-hidden="true"
                          />

                          Gerenciar usuários
                        </button>
                      )}

                    </div>
                  )}
                </div>


                {/* =========================================
                    SAIR
                ========================================= */}

                <button
                  type="button"
                  className="navbar-logout-button"
                  onClick={
                    handleLogout
                  }
                  aria-label="Sair da conta"
                >
                  <LogOut
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span>
                    Sair
                  </span>
                </button>

              </div>
            ) : (

              /* ===========================================
                 LOGIN
              =========================================== */

              <button
                type="button"
                className="btn-login"
                onClick={() =>
                  goTo("/login")
                }
              >
                <LogIn
                  size={17}
                  aria-hidden="true"
                />

                Entrar
              </button>

            )}

          </div>
        </div>
      </header>


      {/* ===================================================
          ALERTA DE NOVO PEDIDO
      =================================================== */}

      {mostrarAlertaPedido &&
        ultimaNotificacaoPedido && (
          <div
            className="novo-pedido-alerta"
            role="status"
          >
            <button
              type="button"
              className="novo-pedido-alerta-conteudo"
              onClick={
                abrirPedidosPeloAlerta
              }
            >
              <span className="novo-pedido-alerta-icone">
                <Bell
                  size={20}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </span>


              <span className="novo-pedido-alerta-textos">

                <strong>
                  Novo pedido recebido
                </strong>

                <span>
                  Pedido{" "}
                  <b>
                    {ultimaNotificacaoPedido
                      .numeroPedido ||
                      ultimaNotificacaoPedido
                        .codigoPedidoOmie}
                  </b>

                  {ultimaNotificacaoPedido
                    .cliente
                    ? ` • ${ultimaNotificacaoPedido.cliente}`
                    : ""}
                </span>

                <small>
                  Clique para abrir Pedidos
                </small>

              </span>
            </button>


            <button
              type="button"
              className="novo-pedido-alerta-fechar"
              onClick={
                fecharAlertaPedido
              }
              aria-label="Fechar aviso"
            >
              <X
                size={16}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

    </>
  );
}


export default memo(
  Navbar
);