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
} from "lucide-react";

import { useNavigate } from "@/lib/navegacao";

import { supabase } from "@/lib/supabaseClient";

import "./Navbar.css";

function Navbar({ user, isAdmin }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  /*
   * O estado começa com "/" tanto no servidor quanto no navegador.
   * Depois que o componente é montado, o caminho real é sincronizado.
   * Isso evita o erro "window is not defined" durante SSR.
   */
  const [currentPath, setCurrentPath] = useState("/");

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigationItems = useMemo(
    () => [
      {
        label: "Início",
        path: "/",
        icon: Home,
      },
      {
        label: "Produção",
        path: "/dashboard",
        icon: Factory,
      },
      {
        label: "Matéria-prima",
        path: "/dashboard-materia-prima",
        icon: Boxes,
      },
      {
        label: "Produtividade",
        shortLabel: "Eficiência",
        path: "/dashboard-produtividade",
        icon: Gauge,
      },
      {
        label: "Relatórios",
        path: "/relatorios",
        icon: FileText,
      },
    ],
    [],
  );

  const userName = useMemo(() => {
    if (!user?.email) {
      return "";
    }

    const emailName = user.email.split("@")[0];

    return emailName.replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [user]);

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

  const goTo = useCallback(
    (path) => {
      setCurrentPath(path);
      setUserMenuOpen(false);
      navigate(path);
    },
    [navigate],
  );

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

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((currentValue) => !currentValue);
  }, []);

  /*
   * Sincroniza a rota apenas depois que o navegador estiver disponível.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncCurrentPath = () => {
      setCurrentPath(window.location.pathname || "/");
      setUserMenuOpen(false);
    };

    syncCurrentPath();

    window.addEventListener("popstate", syncCurrentPath);

    return () => {
      window.removeEventListener("popstate", syncCurrentPath);
    };
  }, []);

  /*
   * Fecha o menu ao clicar fora.
   */
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

  /*
   * Fecha o menu com a tecla Escape.
   */
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

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <button
          type="button"
          className="navbar-brand"
          onClick={() => goTo("/")}
          aria-label="Ir para o início"
        >
          <img src="/Logo_Pedrasplast.png" alt="Pedrasplast" className="brand-logo-img" />
        </button>

        {user && (
          <nav className="navbar-navigation" aria-label="Navegação principal">
            {navigationItems.map(({ label, shortLabel, path, icon: Icon }) => {
              const active = currentPath === path;

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
