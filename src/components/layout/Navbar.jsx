import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Factory,
  FileText,
  Gauge,
  Home,
  LogIn,
  LogOut,
  ShoppingCart,
  Upload,
  Users,
} from "lucide-react";

import { useNavigate } from "@/lib/navegacao";
import { supabase } from "@/lib/supabaseClient";

import "./Navbar.css";

const NAVIGATION_ITEMS = Object.freeze([
  { label: "Início", shortLabel: "Início", path: "/", icon: Home },
  { label: "Produção", shortLabel: "Produção", path: "/dashboard", icon: Factory },
  {
    label: "Produtividade",
    shortLabel: "Eficiência",
    path: "/dashboard-produtividade",
    icon: Gauge,
  },
  { label: "Pedidos", shortLabel: "Pedidos", path: "/pedidos", icon: ShoppingCart },
  { label: "Relatórios", shortLabel: "Relatórios", path: "/relatorios", icon: FileText },
]);

function normalizarCaminho(path) {
  const caminho = String(path || "/").trim();
  return caminho === "/" ? "/" : caminho.replace(/\/+$/, "");
}

function obterNomeUsuario(email) {
  if (!email) {
    return "";
  }

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function obterIniciais(nome) {
  if (!nome) {
    return "US";
  }

  const palavras = nome.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 1) {
    return palavras[0].slice(0, 2).toUpperCase();
  }

  return `${palavras[0][0]}${palavras.at(-1)[0]}`.toUpperCase();
}

function Navbar({ user, isAdmin }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Usa o estado oficial do TanStack Router. Evita interceptar history.pushState
  // globalmente e mantém a aba ativa sincronizada com qualquer navegação do app.
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const currentPath = useMemo(() => normalizarCaminho(pathname), [pathname]);

  const userName = useMemo(() => obterNomeUsuario(user?.email), [user?.email]);
  const userInitials = useMemo(() => obterIniciais(userName), [userName]);

  const goTo = useCallback(
    (path) => {
      setUserMenuOpen(false);
      navigate(normalizarCaminho(path));
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
      navigate("/");
    }
  }, [navigate]);

  const toggleUserMenu = useCallback(() => {
    setUserMenuOpen((aberto) => !aberto);
  }, []);

  // Os listeners existem somente enquanto o menu está aberto.
  useEffect(() => {
    if (!userMenuOpen || typeof document === "undefined") {
      return undefined;
    }

    const fecharAoClicarFora = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    const fecharComEscape = (event) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [userMenuOpen]);

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
            {NAVIGATION_ITEMS.map(({ label, shortLabel, path, icon: Icon }) => {
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

export default memo(Navbar);
