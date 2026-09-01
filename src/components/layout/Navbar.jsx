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
  Boxes,
  ChevronDown,
  DollarSign,
  Factory,
  FileText,
  Gauge,
  Home,
  LogIn,
  LogOut,
  Menu,
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
   NAVEGAÇÃO POR MÓDULOS

   Mantemos somente rotas que já existem hoje.
   Depois adicionaremos as novas páginas Financeiras.
========================================================= */

const NAVIGATION_GROUPS = Object.freeze([
  {
    type: "link",
    id: "inicio",
    label: "Início",
    path: "/",
    icon: Home,
    permissao: null,
  },

  {
    type: "group",
    id: "producao",
    label: "Produção",
    icon: Factory,

    children: [
      {
        label: "Visão Geral",
        path: "/dashboard",
        icon: Factory,
        permissao: "dashboard",
      },

      {
        label: "Produtividade",
        path: "/dashboard-produtividade",
        icon: Gauge,
        permissao: "dashboard_produtividade",
      },
    ],
  },

  {
    type: "group",
    id: "pedidos",
    label: "Pedidos",
    icon: ShoppingCart,

    children: [
      {
        label: "Pedidos",
        path: "/pedidos",
        icon: ShoppingCart,
        permissao: "pedidos",
        notificationKey: "pedidos",
      },
    ],
  },

  {
    type: "link",
    id: "materia-prima",
    label: "Matéria-Prima",
    path: "/materia-prima",
    icon: Boxes,
    permissao: "materia_prima",
  },

  {
    type: "group",
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,

    children: [
      {
        label: "Visão Geral",
        path: "/financeiro",
        icon: DollarSign,
        permissao: "financeiro",
      },

      {
        label: "Evolução Mensal",
        path: "/financeiro-evolucao-mensal",
        icon: DollarSign,
        permissao: "financeiro_evolucao_mensal",
      },
    ],
  },

  {
    type: "link",
    id: "relatorios",
    label: "Relatórios",
    path: "/relatorios",
    icon: FileText,
    permissao: "relatorios",
  },
]);


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarCaminho(path) {
  const caminho =
    String(
      path || "/",
    ).trim();

  return caminho === "/"
    ? "/"
    : caminho.replace(
        /\/+$/,
        "",
      );
}


function obterNomeUsuario(email) {
  if (!email) {
    return "";
  }

  return String(email)
    .split("@")[0]
    .replace(
      /[._-]+/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase(),
    );
}


function obterIniciais(nome) {
  if (!nome) {
    return "US";
  }

  const palavras =
    String(nome)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    palavras.length ===
    0
  ) {
    return "US";
  }

  if (
    palavras.length ===
    1
  ) {
    return palavras[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return `${palavras[0][0]}${palavras.at(-1)[0]}`
    .toUpperCase();
}


function obterTipoNotificacao(
  notificacao,
) {
  const tipo =
    String(
      notificacao
        ?.tipo_ultima_ocorrencia ??
      notificacao?.tipo ??
      "novo",
    )
      .trim()
      .toLowerCase();

  return tipo ===
    "alterado"
    ? "alterado"
    : "novo";
}


function formatarBadgePedidos(
  quantidade,
) {
  const numero =
    Number(
      quantidade || 0,
    );

  if (
    !Number.isFinite(
      numero,
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero > 99
    ? "99+"
    : String(
        numero,
      );
}


/* =========================================================
   NAVBAR
========================================================= */

function Navbar({
  user,
  isAdmin,
}) {
  const navigate =
    useNavigate();

  const menuRef =
    useRef(null);

  const navigationRef =
    useRef(null);

  const alertaTimeoutRef =
    useRef(null);


  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    userMenuOpen,
    setUserMenuOpen,
  ] =
    useState(false);

  const [
    desktopMenuOpen,
    setDesktopMenuOpen,
  ] =
    useState(null);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  const [
    mobileGroupOpen,
    setMobileGroupOpen,
  ] =
    useState(null);

  const [
    pedidosNaoLidos,
    setPedidosNaoLidos,
  ] =
    useState(0);

  const [
    ultimaNotificacaoPedido,
    setUltimaNotificacaoPedido,
  ] =
    useState(null);

  const [
    mostrarAlertaPedido,
    setMostrarAlertaPedido,
  ] =
    useState(false);


  /* =======================================================
     PERMISSÕES
  ======================================================= */

  const {
    podeAcessarTela,
    loadingPermissoes,
  } =
    usePermissoes();


  /* =======================================================
     ROTA ATUAL
  ======================================================= */

  const pathname =
    useRouterState({
      select:
        (state) =>
          state
            .location
            .pathname,
    });


  const currentPath =
    useMemo(
      () =>
        normalizarCaminho(
          pathname,
        ),
      [
        pathname,
      ],
    );


  /* =======================================================
     USUÁRIO
  ======================================================= */

  const userName =
    useMemo(
      () =>
        obterNomeUsuario(
          user?.email,
        ),
      [
        user?.email,
      ],
    );


  const userInitials =
    useMemo(
      () =>
        obterIniciais(
          userName,
        ),
      [
        userName,
      ],
    );


  /* =======================================================
     PEDIDOS
  ======================================================= */

  const podeAcessarPedidos =
    useMemo(
      () => {
        if (!user) {
          return false;
        }

        if (isAdmin) {
          return true;
        }

        if (
          loadingPermissoes
        ) {
          return false;
        }

        return podeAcessarTela(
          "pedidos",
        );
      },
      [
        user,
        isAdmin,
        loadingPermissoes,
        podeAcessarTela,
      ],
    );


  /* =======================================================
     IMPORTAÇÃO
  ======================================================= */

  const podeImportar =
    useMemo(
      () => {
        if (!user) {
          return false;
        }

        if (isAdmin) {
          return true;
        }

        if (
          loadingPermissoes
        ) {
          return false;
        }

        return podeAcessarTela(
          "importar",
        );
      },
      [
        user,
        isAdmin,
        loadingPermissoes,
        podeAcessarTela,
      ],
    );


  /* =======================================================
     PERMISSÃO DE ITEM
  ======================================================= */

  const podeVerItem =
    useCallback(
      (item) => {
        if (
          !item?.permissao
        ) {
          return true;
        }

        if (isAdmin) {
          return true;
        }

        if (
          loadingPermissoes
        ) {
          return false;
        }

        return podeAcessarTela(
          item.permissao,
        );
      },
      [
        isAdmin,
        loadingPermissoes,
        podeAcessarTela,
      ],
    );


  /* =======================================================
     MÓDULOS VISÍVEIS
  ======================================================= */

  const navigationGroupsVisiveis =
    useMemo(
      () => {
        if (!user) {
          return [];
        }

        return NAVIGATION_GROUPS
          .map(
            (item) => {
              if (
                item.type ===
                "link"
              ) {
                return podeVerItem(
                  item,
                )
                  ? item
                  : null;
              }

              const children =
                (
                  item.children ||
                  []
                ).filter(
                  podeVerItem,
                );

              if (
                children.length ===
                0
              ) {
                return null;
              }

              return {
                ...item,
                children,
              };
            },
          )
          .filter(Boolean);
      },
      [
        user,
        podeVerItem,
      ],
    );


  /* =======================================================
     ATIVOS
  ======================================================= */

  const caminhoAtivo =
    useCallback(
      (path) =>
        currentPath ===
        normalizarCaminho(
          path,
        ),
      [
        currentPath,
      ],
    );


  const grupoAtivo =
    useCallback(
      (grupo) =>
        (
          grupo?.children ||
          []
        ).some(
          (child) =>
            caminhoAtivo(
              child.path,
            ),
        ),
      [
        caminhoAtivo,
      ],
    );


  const badgePedidos =
    useMemo(
      () =>
        formatarBadgePedidos(
          pedidosNaoLidos,
        ),
      [
        pedidosNaoLidos,
      ],
    );


  /* =======================================================
     BUSCAR QUANTIDADE DE PEDIDOS PENDENTES
  ======================================================= */

  const atualizarQuantidadePedidosNovos =
    useCallback(
      async () => {
        if (
          !user ||
          !podeAcessarPedidos
        ) {
          setPedidosNaoLidos(
            0,
          );

          return;
        }

        try {
          const {
            data,
            error,
          } =
            await supabase.rpc(
              "contar_notificacoes_pedidos_nao_lidas",
            );


          if (error) {
            console.error(
              "Erro ao consultar notificações de pedidos:",
              error,
            );

            return;
          }


          const quantidade =
            Number(
              data ?? 0,
            );


          setPedidosNaoLidos(
            Number.isFinite(
              quantidade,
            )
              ? quantidade
              : 0,
          );
        } catch (error) {
          console.error(
            "Erro inesperado ao consultar notificações de pedidos:",
            error,
          );
        }
      },
      [
        user,
        podeAcessarPedidos,
      ],
    );


  /* =======================================================
     CONTADOR INICIAL
  ======================================================= */

  useEffect(
    () => {
      if (
        !user ||
        !podeAcessarPedidos
      ) {
        setPedidosNaoLidos(
          0,
        );

        return undefined;
      }

      void atualizarQuantidadePedidosNovos();

      return undefined;
    },
    [
      user,
      podeAcessarPedidos,
      atualizarQuantidadePedidosNovos,
    ],
  );


  /* =======================================================
     REALTIME
  ======================================================= */

  useEffect(
    () => {
      if (
        !user ||
        !podeAcessarPedidos
      ) {
        return undefined;
      }


      const canal =
        supabase
          .channel(
            `navbar-pedidos-${user.id}`,
          )
          .on(
            "postgres_changes",
            {
              event:
                "*",

              schema:
                "public",

              table:
                "pedidos_notificacoes",
            },
            (
              payload,
            ) => {
              const notificacao =
                payload?.new;


              if (
                !notificacao
              ) {
                void atualizarQuantidadePedidosNovos();

                return;
              }


              if (
                notificacao
                  .notificar !==
                true
              ) {
                void atualizarQuantidadePedidosNovos();

                return;
              }


              const tipo =
                obterTipoNotificacao(
                  notificacao,
                );


              void atualizarQuantidadePedidosNovos();


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

                tipo,

                resumo:
                  notificacao
                    .resumo ||
                  (
                    tipo ===
                    "alterado"
                      ? "Pedido alterado"
                      : "Novo pedido recebido"
                  ),

                camposAlterados:
                  Array.isArray(
                    notificacao
                      .campos_alterados,
                  )
                    ? notificacao
                        .campos_alterados
                    : [],
              });


              setMostrarAlertaPedido(
                true,
              );


              if (
                alertaTimeoutRef
                  .current
              ) {
                window.clearTimeout(
                  alertaTimeoutRef
                    .current,
                );
              }


              alertaTimeoutRef.current =
                window.setTimeout(
                  () => {
                    setMostrarAlertaPedido(
                      false,
                    );
                  },
                  10000,
                );
            },
          )
          .subscribe();


      return () => {
        if (
          alertaTimeoutRef
            .current
        ) {
          window.clearTimeout(
            alertaTimeoutRef
              .current,
          );

          alertaTimeoutRef.current =
            null;
        }


        supabase.removeChannel(
          canal,
        );
      };
    },
    [
      user,
      podeAcessarPedidos,
      atualizarQuantidadePedidosNovos,
    ],
  );


  /* =======================================================
     EVENTO DO PEDIDOSPAGE
  ======================================================= */

  useEffect(
    () => {
      if (
        !user ||
        !podeAcessarPedidos
      ) {
        return undefined;
      }


      const atualizarContador =
        () => {
          void atualizarQuantidadePedidosNovos();
        };


      window.addEventListener(
        "pedidos-notificacoes-atualizadas",
        atualizarContador,
      );


      return () => {
        window.removeEventListener(
          "pedidos-notificacoes-atualizadas",
          atualizarContador,
        );
      };
    },
    [
      user,
      podeAcessarPedidos,
      atualizarQuantidadePedidosNovos,
    ],
  );


  /* =======================================================
     POLLING
  ======================================================= */

  useEffect(
    () => {
      if (
        !user ||
        !podeAcessarPedidos
      ) {
        return undefined;
      }


      const intervalo =
        window.setInterval(
          () => {
            void atualizarQuantidadePedidosNovos();
          },
          60_000,
        );


      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [
      user,
      podeAcessarPedidos,
      atualizarQuantidadePedidosNovos,
    ],
  );


  /* =======================================================
     ABA VISÍVEL
  ======================================================= */

  useEffect(
    () => {
      if (
        !user ||
        !podeAcessarPedidos
      ) {
        return undefined;
      }


      const verificarAoVoltar =
        () => {
          if (
            document
              .visibilityState ===
            "visible"
          ) {
            void atualizarQuantidadePedidosNovos();
          }
        };


      document.addEventListener(
        "visibilitychange",
        verificarAoVoltar,
      );


      return () => {
        document.removeEventListener(
          "visibilitychange",
          verificarAoVoltar,
        );
      };
    },
    [
      user,
      podeAcessarPedidos,
      atualizarQuantidadePedidosNovos,
    ],
  );


  /* =======================================================
     NAVEGAÇÃO
  ======================================================= */

  const goTo =
    useCallback(
      (path) => {
        setUserMenuOpen(
          false,
        );

        setDesktopMenuOpen(
          null,
        );

        setMobileMenuOpen(
          false,
        );

        setMobileGroupOpen(
          null,
        );

        navigate(
          normalizarCaminho(
            path,
          ),
        );
      },
      [
        navigate,
      ],
    );


  /* =======================================================
     DESKTOP
  ======================================================= */

  const toggleDesktopMenu =
    useCallback(
      (id) => {
        setUserMenuOpen(
          false,
        );

        setDesktopMenuOpen(
          (atual) =>
            atual === id
              ? null
              : id,
        );
      },
      [],
    );


  /* =======================================================
     MOBILE
  ======================================================= */

  const abrirMenuMobile =
    useCallback(
      () => {
        const grupoAtual =
          navigationGroupsVisiveis.find(
            (item) =>
              item.type ===
                "group" &&
              grupoAtivo(
                item,
              ),
          );

        setUserMenuOpen(
          false,
        );

        setDesktopMenuOpen(
          null,
        );

        setMobileGroupOpen(
          grupoAtual?.id ||
            null,
        );

        setMobileMenuOpen(
          true,
        );
      },
      [
        navigationGroupsVisiveis,
        grupoAtivo,
      ],
    );


  const fecharMenuMobile =
    useCallback(
      () => {
        setMobileMenuOpen(
          false,
        );

        setMobileGroupOpen(
          null,
        );
      },
      [],
    );


  const toggleMobileGroup =
    useCallback(
      (id) => {
        setMobileGroupOpen(
          (atual) =>
            atual === id
              ? null
              : id,
        );
      },
      [],
    );


  /* =======================================================
     ALERTA
  ======================================================= */

  const abrirPedidosPeloAlerta =
    useCallback(
      () => {
        setMostrarAlertaPedido(
          false,
        );

        goTo(
          "/pedidos",
        );
      },
      [
        goTo,
      ],
    );


  const fecharAlertaPedido =
    useCallback(
      (event) => {
        event?.stopPropagation?.();

        setMostrarAlertaPedido(
          false,
        );


        if (
          alertaTimeoutRef
            .current
        ) {
          window.clearTimeout(
            alertaTimeoutRef
              .current,
          );

          alertaTimeoutRef.current =
            null;
        }
      },
      [],
    );


  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout =
    useCallback(
      async () => {
        setUserMenuOpen(
          false,
        );

        setDesktopMenuOpen(
          null,
        );

        setMobileMenuOpen(
          false,
        );

        setMobileGroupOpen(
          null,
        );


        if (
          typeof window !==
          "undefined"
        ) {
          window
            .localStorage
            .removeItem(
              "expiracao_login",
            );
        }


        try {
          const {
            error,
          } =
            await supabase
              .auth
              .signOut();


          if (error) {
            console.error(
              "Erro ao encerrar a sessão:",
              error,
            );
          }
        } catch (error) {
          console.error(
            "Erro inesperado ao encerrar a sessão:",
            error,
          );
        } finally {
          navigate(
            "/",
          );
        }
      },
      [
        navigate,
      ],
    );


  /* =======================================================
     MENU USUÁRIO
  ======================================================= */

  const toggleUserMenu =
    useCallback(
      () => {
        setDesktopMenuOpen(
          null,
        );

        setUserMenuOpen(
          (aberto) =>
            !aberto,
        );
      },
      [],
    );


  /* =======================================================
     FECHAR FORA / ESC
  ======================================================= */

  useEffect(
    () => {
      const fecharAoClicarFora =
        (event) => {
          if (
            userMenuOpen &&
            menuRef.current &&
            !menuRef
              .current
              .contains(
                event.target,
              )
          ) {
            setUserMenuOpen(
              false,
            );
          }


          if (
            desktopMenuOpen &&
            navigationRef.current &&
            !navigationRef
              .current
              .contains(
                event.target,
              )
          ) {
            setDesktopMenuOpen(
              null,
            );
          }
        };


      document.addEventListener(
        "mousedown",
        fecharAoClicarFora,
      );


      return () => {
        document.removeEventListener(
          "mousedown",
          fecharAoClicarFora,
        );
      };
    },
    [
      userMenuOpen,
      desktopMenuOpen,
    ],
  );


  useEffect(
    () => {
      const fecharComEscape =
        (event) => {
          if (
            event.key !==
            "Escape"
          ) {
            return;
          }

          setUserMenuOpen(
            false,
          );

          setDesktopMenuOpen(
            null,
          );

          setMobileMenuOpen(
            false,
          );

          setMobileGroupOpen(
            null,
          );
        };


      document.addEventListener(
        "keydown",
        fecharComEscape,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          fecharComEscape,
        );
      };
    },
    [],
  );


  /* =======================================================
     BLOQUEAR SCROLL MOBILE
  ======================================================= */

  useEffect(
    () => {
      if (
        !mobileMenuOpen
      ) {
        return undefined;
      }

      const overflowAnterior =
        document
          .body
          .style
          .overflow;

      document
        .body
        .style
        .overflow =
        "hidden";


      return () => {
        document
          .body
          .style
          .overflow =
          overflowAnterior;
      };
    },
    [
      mobileMenuOpen,
    ],
  );


  const alertaPedidoAlterado =
    ultimaNotificacaoPedido
      ?.tipo ===
    "alterado";


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <header className="main-navbar">

        <div className="navbar-container">

          <button
            type="button"
            className="navbar-brand"
            onClick={
              () =>
                goTo(
                  "/",
                )
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
              DESKTOP
          =============================================== */}

          {user && (

            <nav
              ref={
                navigationRef
              }
              className="navbar-navigation navbar-navigation-modulos"
              aria-label="Navegação principal"
            >

              {navigationGroupsVisiveis.map(
                (
                  item,
                ) => {
                  const Icon =
                    item.icon;


                  if (
                    item.type ===
                    "link"
                  ) {
                    const active =
                      caminhoAtivo(
                        item.path,
                      );


                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        className={
                          active
                            ? "navbar-navigation-link active"
                            : "navbar-navigation-link"
                        }
                        onClick={
                          () =>
                            goTo(
                              item.path,
                            )
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
                        </span>

                        <span className="navbar-label-desktop">
                          {item.label}
                        </span>

                      </button>
                    );
                  }


                  const active =
                    grupoAtivo(
                      item,
                    );

                  const aberto =
                    desktopMenuOpen ===
                    item.id;

                  const ehPedidos =
                    item.id ===
                    "pedidos";


                  return (
                    <div
                      key={
                        item.id
                      }
                      className="navbar-modulo"
                    >

                      <button
                        type="button"
                        className={
                          active
                            ? "navbar-navigation-link navbar-modulo-trigger active"
                            : "navbar-navigation-link navbar-modulo-trigger"
                        }
                        onClick={
                          () =>
                            toggleDesktopMenu(
                              item.id,
                            )
                        }
                        aria-expanded={
                          aberto
                        }
                        aria-haspopup="menu"
                      >

                        <span className="navbar-navigation-icon">
                          <Icon
                            size={18}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>


                        <span className="navbar-label-desktop">
                          {item.label}
                        </span>


                        {ehPedidos &&
                          badgePedidos && (

                            <span className="navbar-pedidos-badge navbar-pedidos-badge-modulo">
                              {badgePedidos}
                            </span>

                          )}


                        <ChevronDown
                          size={14}
                          strokeWidth={2.2}
                          className={
                            aberto
                              ? "navbar-modulo-chevron open"
                              : "navbar-modulo-chevron"
                          }
                          aria-hidden="true"
                        />

                      </button>


                      {aberto && (

                        <div
                          className="navbar-modulo-dropdown"
                          role="menu"
                        >

                          {item.children.map(
                            (
                              child,
                            ) => {
                              const ChildIcon =
                                child.icon;

                              const childActive =
                                caminhoAtivo(
                                  child.path,
                                );

                              const childPedidos =
                                child
                                  .notificationKey ===
                                "pedidos";


                              return (
                                <button
                                  key={
                                    child.path
                                  }
                                  type="button"
                                  className={
                                    childActive
                                      ? "navbar-modulo-dropdown-item active"
                                      : "navbar-modulo-dropdown-item"
                                  }
                                  onClick={
                                    () =>
                                      goTo(
                                        child.path,
                                      )
                                  }
                                  role="menuitem"
                                >

                                  <span className="navbar-modulo-dropdown-icon">
                                    <ChildIcon
                                      size={17}
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    />
                                  </span>


                                  <span className="navbar-modulo-dropdown-text">
                                    {child.label}
                                  </span>


                                  {childPedidos &&
                                    badgePedidos && (

                                      <span className="navbar-mobile-count">
                                        {badgePedidos}
                                      </span>

                                    )}

                                </button>
                              );
                            },
                          )}

                        </div>

                      )}

                    </div>
                  );
                },
              )}

            </nav>

          )}


          {/* ===============================================
              AUTENTICAÇÃO / MOBILE
          =============================================== */}

          <div className="navbar-auth-section">

            {user ? (
              <>

                <button
                  type="button"
                  className="navbar-hamburger"
                  onClick={
                    abrirMenuMobile
                  }
                  aria-expanded={
                    mobileMenuOpen
                  }
                  aria-controls="navbar-mobile-drawer"
                  aria-label="Abrir menu principal"
                >
                  <Menu
                    size={22}
                    strokeWidth={2}
                    aria-hidden="true"
                  />


                  {badgePedidos && (
                    <span className="navbar-hamburger-badge">
                      {badgePedidos}
                    </span>
                  )}
                </button>


                <div className="navbar-user-controls">

                  <div
                    ref={
                      menuRef
                    }
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


                    {userMenuOpen && (

                      <div
                        className="navbar-user-menu"
                        role="menu"
                      >

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


                        <button
                          type="button"
                          className="user-menu-item"
                          onClick={
                            () =>
                              goTo(
                                "/",
                              )
                          }
                          role="menuitem"
                        >
                          <Home
                            size={17}
                            aria-hidden="true"
                          />

                          Página inicial
                        </button>


                        {podeImportar && (

                          <button
                            type="button"
                            className="user-menu-item"
                            onClick={
                              () =>
                                goTo(
                                  "/importar",
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


                        {isAdmin && (

                          <button
                            type="button"
                            className="user-menu-item"
                            onClick={
                              () =>
                                goTo(
                                  "/usuarios",
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

              </>
            ) : (

              <button
                type="button"
                className="btn-login"
                onClick={
                  () =>
                    goTo(
                      "/login",
                    )
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
          MOBILE DRAWER
      =================================================== */}

      {user &&
        mobileMenuOpen && (
          <>

            <button
              type="button"
              className="navbar-mobile-overlay"
              onClick={
                fecharMenuMobile
              }
              aria-label="Fechar menu principal"
            />


            <aside
              id="navbar-mobile-drawer"
              className="navbar-mobile-drawer"
              aria-label="Menu principal"
            >

              <div className="navbar-mobile-header">

                <div>
                  <span className="navbar-mobile-eyebrow">
                    Navegação
                  </span>

                  <strong>
                    Menu
                  </strong>
                </div>


                <button
                  type="button"
                  className="navbar-mobile-close"
                  onClick={
                    fecharMenuMobile
                  }
                  aria-label="Fechar menu"
                >
                  <X
                    size={20}
                    aria-hidden="true"
                  />
                </button>

              </div>


              <div className="navbar-mobile-user">

                <span className="navbar-mobile-avatar">
                  {userInitials}
                </span>

                <div>

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {isAdmin
                      ? "Administrador"
                      : "Operador"}
                  </span>

                </div>

              </div>


              <nav
                className="navbar-mobile-nav"
                aria-label="Navegação mobile"
              >

                {navigationGroupsVisiveis.map(
                  (
                    item,
                  ) => {
                    const Icon =
                      item.icon;


                    if (
                      item.type ===
                      "link"
                    ) {
                      const active =
                        caminhoAtivo(
                          item.path,
                        );


                      return (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          className={
                            active
                              ? "navbar-mobile-link active"
                              : "navbar-mobile-link"
                          }
                          onClick={
                            () =>
                              goTo(
                                item.path,
                              )
                          }
                        >

                          <span className="navbar-mobile-link-icon">
                            <Icon
                              size={19}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </span>


                          <span className="navbar-mobile-link-label">
                            {item.label}
                          </span>

                        </button>
                      );
                    }


                    const active =
                      grupoAtivo(
                        item,
                      );

                    const aberto =
                      mobileGroupOpen ===
                      item.id;

                    const ehPedidos =
                      item.id ===
                      "pedidos";


                    return (
                      <div
                        key={
                          item.id
                        }
                        className="navbar-mobile-group"
                      >

                        <button
                          type="button"
                          className={
                            active
                              ? "navbar-mobile-group-trigger active"
                              : "navbar-mobile-group-trigger"
                          }
                          onClick={
                            () =>
                              toggleMobileGroup(
                                item.id,
                              )
                          }
                          aria-expanded={
                            aberto
                          }
                        >

                          <span className="navbar-mobile-link-icon">
                            <Icon
                              size={19}
                              strokeWidth={2}
                              aria-hidden="true"
                            />
                          </span>


                          <span className="navbar-mobile-link-label">
                            {item.label}
                          </span>


                          {ehPedidos &&
                            badgePedidos && (

                              <span className="navbar-mobile-count">
                                {badgePedidos}
                              </span>

                            )}


                          <ChevronDown
                            size={17}
                            strokeWidth={2.2}
                            className={
                              aberto
                                ? "navbar-mobile-chevron open"
                                : "navbar-mobile-chevron"
                            }
                            aria-hidden="true"
                          />

                        </button>


                        {aberto && (

                          <div className="navbar-mobile-submenu">

                            {item.children.map(
                              (
                                child,
                              ) => {
                                const ChildIcon =
                                  child.icon;

                                const childActive =
                                  caminhoAtivo(
                                    child.path,
                                  );

                                const childPedidos =
                                  child
                                    .notificationKey ===
                                  "pedidos";


                                return (
                                  <button
                                    key={
                                      child.path
                                    }
                                    type="button"
                                    className={
                                      childActive
                                        ? "navbar-mobile-submenu-item active"
                                        : "navbar-mobile-submenu-item"
                                    }
                                    onClick={
                                      () =>
                                        goTo(
                                          child.path,
                                        )
                                    }
                                  >

                                    <ChildIcon
                                      size={17}
                                      strokeWidth={2}
                                      aria-hidden="true"
                                    />


                                    <span>
                                      {child.label}
                                    </span>


                                    {childPedidos &&
                                      badgePedidos && (

                                        <span className="navbar-mobile-count">
                                          {badgePedidos}
                                        </span>

                                      )}

                                  </button>
                                );
                              },
                            )}

                          </div>

                        )}

                      </div>
                    );
                  },
                )}

              </nav>


              {(podeImportar ||
                isAdmin) && (

                <div className="navbar-mobile-admin">

                  <span className="navbar-mobile-section-label">
                    Administração
                  </span>


                  {podeImportar && (

                    <button
                      type="button"
                      className="navbar-mobile-admin-link"
                      onClick={
                        () =>
                          goTo(
                            "/importar",
                          )
                      }
                    >
                      <Upload
                        size={18}
                        aria-hidden="true"
                      />

                      <span>
                        Importar dados
                      </span>
                    </button>

                  )}


                  {isAdmin && (

                    <button
                      type="button"
                      className="navbar-mobile-admin-link"
                      onClick={
                        () =>
                          goTo(
                            "/usuarios",
                          )
                      }
                    >
                      <Users
                        size={18}
                        aria-hidden="true"
                      />

                      <span>
                        Gerenciar usuários
                      </span>
                    </button>

                  )}

                </div>

              )}


              <div className="navbar-mobile-footer">

                <button
                  type="button"
                  className="navbar-mobile-logout"
                  onClick={
                    handleLogout
                  }
                >
                  <LogOut
                    size={18}
                    aria-hidden="true"
                  />

                  <span>
                    Sair
                  </span>
                </button>

              </div>

            </aside>

          </>
        )}


      {/* ===================================================
          ALERTA DE PEDIDO
      =================================================== */}

      {mostrarAlertaPedido &&
        ultimaNotificacaoPedido && (

          <div
            className={[
              "novo-pedido-alerta",

              alertaPedidoAlterado
                ? "novo-pedido-alerta-alterado"
                : "novo-pedido-alerta-novo",
            ].join(" ")}
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
                  {alertaPedidoAlterado
                    ? "Pedido alterado"
                    : "Novo pedido recebido"}
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


                {alertaPedidoAlterado &&
                  ultimaNotificacaoPedido
                    .resumo && (

                    <small className="novo-pedido-alerta-resumo">
                      {
                        ultimaNotificacaoPedido
                          .resumo
                      }
                    </small>

                  )}


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
  Navbar,
);