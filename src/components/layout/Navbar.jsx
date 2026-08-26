import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Boxes,
  ChevronDown,
  Factory,
  Gauge,
  Home,
  LogIn,
  LogOut,
  Upload,
  Users,
  FileText,
  ShoppingCart,
} from "lucide-react";

import { useNavigate } from "@/lib/navegacao";

import { supabase } from "@/lib/supabaseClient";

import "./Navbar.css";

/* =====================================================
   NORMALIZA CAMINHO
===================================================== */

function normalizarCaminho(path) {
  const caminho = String(path || "/").trim();

  if (caminho === "/") {
    return "/";
  }

  return caminho.replace(/\/+$/, "");
}

/* =====================================================
   NAVBAR
===================================================== */

function Navbar({ user, isAdmin }) {
  const navigate = useNavigate();

  const menuRef = useRef(null);

  /* =====================================================
     ROTA ATUAL
  ===================================================== */

  const [currentPath, setCurrentPath] = useState("/");

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* =====================================================
     ITENS DA NAVEGAÇÃO
  ===================================================== */

  const navigationItems = useMemo(
    () => [
      {
        label: "Início",

        shortLabel: "Início",

        path: "/",

        icon: Home,
      },

      {
        label: "Produção",

        shortLabel: "Produção",

        path: "/dashboard",

        icon: Factory,
      },

      /*{
        label: "Matéria-prima",

        shortLabel: "Matéria",

        path: "/dashboard-materia-prima",

        icon: Boxes,
      },*/

      {
        label: "Produtividade",

        shortLabel: "Eficiência",

        path: "/dashboard-produtividade",

        icon: Gauge,
      },

       {
        label: "Pedidos",

        shortLabel: "Pedidos",

        path: "/pedidos",

        icon: ShoppingCart,
      },

      {
        label: "Relatórios",

        shortLabel: "Relatórios",

        path: "/relatorios",

        icon: FileText,
      },

     
    ],
    [],
  );

  /* =====================================================
     NOME DO USUÁRIO
  ===================================================== */

  const userName = useMemo(() => {
    if (!user?.email) {
      return "";
    }

    const emailName = user.email.split("@")[0];

    return emailName.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [user]);

  /* =====================================================
     INICIAIS
  ===================================================== */

  const userInitials = useMemo(() => {
    if (!userName) {
      return "US";
    }

    const words = userName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, [userName]);

  /* =====================================================
     NAVEGAÇÃO INTERNA DA NAVBAR
  ===================================================== */

  const goTo = useCallback(
    (path) => {
      const caminho = normalizarCaminho(path);

      setCurrentPath(caminho);

      setUserMenuOpen(false);

      navigate(caminho);
    },
    [navigate],
  );

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);

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
      setCurrentPath("/");

      navigate("/");
    }
  }, [navigate]);

  /* =====================================================
     MENU DO USUÁRIO
  ===================================================== */

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((currentValue) => !currentValue);
  }, []);

  /* =====================================================
     SINCRONIZAÇÃO GLOBAL DA ROTA
  ===================================================== */

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncCurrentPath = () => {
      const caminho = normalizarCaminho(window.location.pathname || "/");

      setCurrentPath(caminho);

      setUserMenuOpen(false);
    };

    const originalPushState = window.history.pushState;

    const originalReplaceState = window.history.replaceState;

    const dispararEventoNavegacao = () => {
      window.dispatchEvent(new Event("app:navigation"));
    };

    const pushStateComEvento = function (...args) {
      const resultado = originalPushState.apply(this, args);

      dispararEventoNavegacao();

      return resultado;
    };

    const replaceStateComEvento = function (...args) {
      const resultado = originalReplaceState.apply(this, args);

      dispararEventoNavegacao();

      return resultado;
    };

    window.history.pushState = pushStateComEvento;

    window.history.replaceState = replaceStateComEvento;

    syncCurrentPath();

    window.addEventListener("popstate", syncCurrentPath);

    window.addEventListener("app:navigation", syncCurrentPath);

    return () => {
      window.removeEventListener("popstate", syncCurrentPath);

      window.removeEventListener("app:navigation", syncCurrentPath);

      if (window.history.pushState === pushStateComEvento) {
        window.history.pushState = originalPushState;
      }

      if (window.history.replaceState === replaceStateComEvento) {
        window.history.replaceState = originalReplaceState;
      }
    };
  }, []);

  /* =====================================================
     FECHA MENU AO CLICAR FORA
  ===================================================== */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const closeMenuOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenuOutside);

    return () => {
      document.removeEventListener("mousedown", closeMenuOutside);
    };
  }, []);

  /* =====================================================
     FECHA MENU COM ESC
  ===================================================== */

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const closeMenuWithEscape = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("keydown", closeMenuWithEscape);

    return () => {
      document.removeEventListener("keydown", closeMenuWithEscape);
    };
  }, []);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
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

        {/* NAVEGAÇÃO */}

        {user && (
          <nav className="navbar-navigation" aria-label="Navegação principal">
            {navigationItems.map(({ label, shortLabel, path, icon: Icon }) => {
              const active = currentPath === normalizarCaminho(path);

              return (
                <button
                  key={path}
                  type="button"
                  className={active ? "navbar-navigation-link active" : "navbar-navigation-link"}
                  onClick={() => goTo(path)}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />

                  <span className="navbar-label-desktop">{label}</span>

                  <span className="navbar-label-mobile">{shortLabel}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* USUÁRIO */}

        <div className="navbar-auth-section">
          {user ? (
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
                  <span className="user-avatar">{userInitials}</span>

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

                {/* MENU DO USUÁRIO */}

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

                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          className="user-menu-item"
                          onClick={() => goTo("/importar")}
                          role="menuitem"
                        >
                          <Upload size={17} aria-hidden="true" />
                          Importar dados
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
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* LOGOUT */}

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
          ) : (
            <button type="button" className="btn-login" onClick={() => goTo("/login")}>
              <LogIn size={17} aria-hidden="true" />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
