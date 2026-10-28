import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouterState } from "@tanstack/react-router";

import {
  Activity,
  ChevronDown,
  Home,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

import { usePermissoes } from "@/hooks/usePermissoes";
import { useAvisosMonitoramento } from "@/features/monitoramento/hooks/useMonitoramento";
import { useNotificacoesPedidos } from "@/features/pedidos/hooks/useNotificacoesPedidos";
import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient";

import {
  NAVIGATION_GROUPS,
  formatarBadgePedidos,
  normalizarCaminho,
  obterIniciais,
  obterNomeUsuario,
} from "./navegacao.config";

import AlertaPedido from "./AlertaPedido";
import NavbarMenuMobile from "./NavbarMenuMobile";

import "./Navbar.css";

/* =========================================================
   NAVBAR
========================================================= */

function Navbar({ user, isAdmin }) {
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const navigationRef = useRef(null);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [desktopMenuOpen, setDesktopMenuOpen] = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [mobileGroupOpen, setMobileGroupOpen] = useState(null);

  const { podeAcessarTela, loadingPermissoes } = usePermissoes();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const currentPath = useMemo(() => normalizarCaminho(pathname), [pathname]);

  const userName = useMemo(() => obterNomeUsuario(user?.email), [user?.email]);

  const userInitials = useMemo(() => obterIniciais(userName), [userName]);

  /* =====================================================
     PERMISSÕES
  ===================================================== */

  const podeAcessarPedidos = useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;
    if (loadingPermissoes) return false;

    return podeAcessarTela("pedidos");
  }, [user, isAdmin, loadingPermissoes, podeAcessarTela]);

  const podeImportar = useMemo(() => {
    if (!user) return false;
    if (isAdmin) return true;
    if (loadingPermissoes) return false;

    return podeAcessarTela("importar");
  }, [user, isAdmin, loadingPermissoes, podeAcessarTela]);

  const podeVerItem = useCallback(
    (item) => {
      if (!item?.permissao) return true;
      if (isAdmin) return true;
      if (loadingPermissoes) return false;

      return podeAcessarTela(item.permissao);
    },
    [isAdmin, loadingPermissoes, podeAcessarTela],
  );

  const navigationGroupsVisiveis = useMemo(() => {
    if (!user) return [];

    return NAVIGATION_GROUPS.map((item) => {
      if (item.type === "link") {
        return podeVerItem(item) ? item : null;
      }

      const children = (item.children || []).filter(podeVerItem);

      if (children.length === 0) return null;

      return {
        ...item,
        children,
      };
    }).filter(Boolean);
  }, [user, podeVerItem]);

  /* =====================================================
     ESTADOS DE NAVEGAÇÃO
  ===================================================== */

  const caminhoAtivo = useCallback(
    (path) => currentPath === normalizarCaminho(path),
    [currentPath],
  );

  const grupoAtivo = useCallback(
    (grupo) => (grupo?.children || []).some((child) => caminhoAtivo(child.path)),
    [caminhoAtivo],
  );

  /* =====================================================
     NOTIFICAÇÕES DE PEDIDOS
  ===================================================== */

  const {
    pedidosNaoLidos,
    ultimaNotificacaoPedido,
    mostrarAlertaPedido,
    ocultarAlertaPedido,
    fecharAlertaPedido,
  } = useNotificacoesPedidos({ user, podeAcessarPedidos });

  const badgePedidos = useMemo(() => formatarBadgePedidos(pedidosNaoLidos), [pedidosNaoLidos]);

  /* Aviso de rotinas com erro (só administradores; ver Monitoramento). */
  const { data: avisosMonitoramento = 0 } = useAvisosMonitoramento(Boolean(user) && isAdmin);
  const badgeMonitoramento =
    avisosMonitoramento > 0 ? formatarBadgePedidos(avisosMonitoramento) : null;

  /* =====================================================
     NAVEGAÇÃO
  ===================================================== */

  const goTo = useCallback(
    (path) => {
      setUserMenuOpen(false);
      setDesktopMenuOpen(null);
      setMobileMenuOpen(false);
      setMobileGroupOpen(null);

      navigate(normalizarCaminho(path));
    },
    [navigate],
  );

  const toggleDesktopMenu = useCallback((id) => {
    setUserMenuOpen(false);

    setDesktopMenuOpen((atual) => (atual === id ? null : id));
  }, []);

  const abrirMenuMobile = useCallback(() => {
    const grupoAtual = navigationGroupsVisiveis.find(
      (item) => item.type === "group" && grupoAtivo(item),
    );

    setUserMenuOpen(false);
    setDesktopMenuOpen(null);

    setMobileGroupOpen(grupoAtual?.id || null);

    setMobileMenuOpen(true);
  }, [navigationGroupsVisiveis, grupoAtivo]);

  const fecharMenuMobile = useCallback(() => {
    setMobileMenuOpen(false);
    setMobileGroupOpen(null);
  }, []);

  const toggleMobileGroup = useCallback((id) => {
    setMobileGroupOpen((atual) => (atual === id ? null : id));
  }, []);

  /* =====================================================
     ALERTAS
  ===================================================== */

  const abrirPedidosPeloAlerta = useCallback(() => {
    ocultarAlertaPedido();
    goTo("/pedidos");
  }, [ocultarAlertaPedido, goTo]);

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    setDesktopMenuOpen(null);
    setMobileMenuOpen(false);
    setMobileGroupOpen(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("expiracao_login");
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro ao encerrar a sessão:", error);
      }
    } catch (error) {
      console.error("Erro inesperado ao encerrar a sessão:", error);
    } finally {
      navigate("/");
    }
  }, [navigate]);

  const toggleUserMenu = useCallback(() => {
    setDesktopMenuOpen(null);

    setUserMenuOpen((aberto) => !aberto);
  }, []);

  /* =====================================================
     FECHAMENTO DE MENUS
  ===================================================== */

  useEffect(() => {
    const fecharAoClicarFora = (event) => {
      if (userMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (
        desktopMenuOpen &&
        navigationRef.current &&
        !navigationRef.current.contains(event.target)
      ) {
        setDesktopMenuOpen(null);
      }
    };

    document.addEventListener("mousedown", fecharAoClicarFora);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
    };
  }, [userMenuOpen, desktopMenuOpen]);

  useEffect(() => {
    const fecharComEscape = (event) => {
      if (event.key !== "Escape") return;

      setUserMenuOpen(false);
      setDesktopMenuOpen(null);
      setMobileMenuOpen(false);
      setMobileGroupOpen(null);
    };

    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [mobileMenuOpen]);

  const alertaPedidoAlterado = ultimaNotificacaoPedido?.tipo === "alterado";

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <>
      <header className="main-navbar">
        <div className="navbar-container">
          {/* LOGO */}

          <button
            type="button"
            className="navbar-brand"
            onClick={() => goTo("/")}
            aria-label="Ir para o início"
          >
            <img src="/Logo_Pedrasplast.png" alt="Pedrasplast" className="brand-logo-img" />
          </button>

          {/* NAVEGAÇÃO DESKTOP */}

          {user && (
            <nav
              ref={navigationRef}
              className="navbar-navigation navbar-navigation-modulos"
              aria-label="Navegação principal"
            >
              {navigationGroupsVisiveis.map((item) => {
                const Icon = item.icon;

                if (item.type === "link") {
                  const active = caminhoAtivo(item.path);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={
                        active ? "navbar-navigation-link active" : "navbar-navigation-link"
                      }
                      onClick={() => goTo(item.path)}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="navbar-navigation-icon">
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                      </span>

                      <span className="navbar-label-desktop">{item.label}</span>
                    </button>
                  );
                }

                const active = grupoAtivo(item);

                const aberto = desktopMenuOpen === item.id;

                const ehPedidos = item.id === "pedidos";

                return (
                  <div key={item.id} className="navbar-modulo">
                    <button
                      type="button"
                      className={
                        active
                          ? "navbar-navigation-link navbar-modulo-trigger active"
                          : "navbar-navigation-link navbar-modulo-trigger"
                      }
                      onClick={() => toggleDesktopMenu(item.id)}
                      aria-expanded={aberto}
                      aria-haspopup="menu"
                    >
                      <span className="navbar-navigation-icon">
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                      </span>

                      <span className="navbar-label-desktop">{item.label}</span>

                      {ehPedidos && badgePedidos && (
                        <span className="navbar-pedidos-badge navbar-pedidos-badge-modulo">
                          {badgePedidos}
                        </span>
                      )}

                      <ChevronDown
                        size={14}
                        strokeWidth={2.2}
                        className={aberto ? "navbar-modulo-chevron open" : "navbar-modulo-chevron"}
                        aria-hidden="true"
                      />
                    </button>

                    {aberto && (
                      <div className="navbar-modulo-dropdown" role="menu">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;

                          const childActive = caminhoAtivo(child.path);

                          const childPedidos = child.notificationKey === "pedidos";

                          return (
                            <button
                              key={child.path}
                              type="button"
                              className={
                                childActive
                                  ? "navbar-modulo-dropdown-item active"
                                  : "navbar-modulo-dropdown-item"
                              }
                              onClick={() => goTo(child.path)}
                              role="menuitem"
                            >
                              <span className="navbar-modulo-dropdown-icon">
                                <ChildIcon size={17} strokeWidth={2} aria-hidden="true" />
                              </span>

                              <span className="navbar-modulo-dropdown-text">{child.label}</span>

                              {childPedidos && badgePedidos && (
                                <span className="navbar-mobile-count">{badgePedidos}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* CONTROLES DE USUÁRIO */}

          <div className="navbar-auth-section">
            {user ? (
              <>
                <button
                  type="button"
                  className="navbar-hamburger"
                  onClick={abrirMenuMobile}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="navbar-mobile-drawer"
                  aria-label="Abrir menu principal"
                >
                  <Menu size={22} strokeWidth={2} aria-hidden="true" />

                  {badgePedidos && <span className="navbar-hamburger-badge">{badgePedidos}</span>}
                </button>

                <div className="navbar-user-controls">
                  <div ref={menuRef} className="navbar-user-area">
                    <button
                      type="button"
                      className={userMenuOpen ? "navbar-user-trigger open" : "navbar-user-trigger"}
                      onClick={toggleUserMenu}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      aria-label="Abrir menu do usuário"
                    >
                      <span className="user-avatar">
                        {userInitials}
                        {badgeMonitoramento && (
                          <span
                            className="navbar-avatar-badge"
                            title="Rotinas automáticas com erro — veja em Monitoramento"
                          >
                            {badgeMonitoramento}
                          </span>
                        )}
                      </span>

                      <span className="user-information">
                        <strong className="user-name">{userName}</strong>

                        <span className="user-role">{isAdmin ? "Administrador" : "Operador"}</span>
                      </span>

                      <ChevronDown
                        size={17}
                        strokeWidth={2}
                        className={userMenuOpen ? "user-menu-arrow open" : "user-menu-arrow"}
                        aria-hidden="true"
                      />
                    </button>

                    {userMenuOpen && (
                      <div className="navbar-user-menu" role="menu">
                        <div className="user-menu-header">
                          <span className="user-menu-avatar">{userInitials}</span>

                          <div>
                            <strong>{userName}</strong>

                            <span>{user.email}</span>
                          </div>
                        </div>

                        <div className="user-menu-divider" />

                        <button
                          type="button"
                          className="user-menu-item"
                          onClick={() => goTo("/")}
                          role="menuitem"
                        >
                          <Home size={17} aria-hidden="true" />
                          Página inicial
                        </button>

                        {podeImportar && (
                          <button
                            type="button"
                            className="user-menu-item"
                            onClick={() => goTo("/importar")}
                            role="menuitem"
                          >
                            <Upload size={17} aria-hidden="true" />
                            Importar dados
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="user-menu-item"
                              onClick={() => goTo("/administracao")}
                              role="menuitem"
                            >
                              <ShieldCheck size={17} aria-hidden="true" />
                              Calendario Industrial
                            </button>

                            <button
                              type="button"
                              className="user-menu-item"
                              onClick={() => goTo("/usuarios")}
                              role="menuitem"
                            >
                              <Users size={17} aria-hidden="true" />
                              Gerenciar usuários
                            </button>

                            <button
                              type="button"
                              className="user-menu-item"
                              onClick={() => goTo("/monitoramento")}
                              role="menuitem"
                            >
                              <Activity size={17} aria-hidden="true" />
                              Monitoramento
                              {badgeMonitoramento && (
                                <span className="navbar-mobile-count">{badgeMonitoramento}</span>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="navbar-logout-button"
                    onClick={handleLogout}
                    aria-label="Sair da conta"
                  >
                    <LogOut size={17} strokeWidth={2} aria-hidden="true" />

                    <span>Sair</span>
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn-login" onClick={() => goTo("/login")}>
                <LogIn size={17} aria-hidden="true" />
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          MENU MOBILE
      ===================================================== */}

      {user && mobileMenuOpen && (
        <NavbarMenuMobile
          userName={userName}
          userInitials={userInitials}
          isAdmin={isAdmin}
          podeImportar={podeImportar}
          navigationGroupsVisiveis={navigationGroupsVisiveis}
          caminhoAtivo={caminhoAtivo}
          grupoAtivo={grupoAtivo}
          mobileGroupOpen={mobileGroupOpen}
          toggleMobileGroup={toggleMobileGroup}
          badgePedidos={badgePedidos}
          badgeMonitoramento={badgeMonitoramento}
          goTo={goTo}
          handleLogout={handleLogout}
          fecharMenuMobile={fecharMenuMobile}
        />
      )}

      {/* =====================================================
          ALERTAS DE NOVOS PEDIDOS / ALTERAÇÕES
      ===================================================== */}

      {mostrarAlertaPedido && ultimaNotificacaoPedido && (
        <AlertaPedido
          ultimaNotificacaoPedido={ultimaNotificacaoPedido}
          alertaPedidoAlterado={alertaPedidoAlterado}
          abrirPedidosPeloAlerta={abrirPedidosPeloAlerta}
          fecharAlertaPedido={fecharAlertaPedido}
        />
      )}
    </>
  );
}

export default memo(Navbar);
