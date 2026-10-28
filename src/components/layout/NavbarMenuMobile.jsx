import { Activity, ChevronDown, LogOut, ShieldCheck, Upload, Users, X } from "lucide-react";

/* =========================================================
   MENU MOBILE (GAVETA LATERAL)

   Só apresenta: o estado (grupo aberto, permissões, contadores)
   e as ações vêm da Navbar.
========================================================= */

export default function NavbarMenuMobile({
  userName,
  userInitials,
  isAdmin,
  podeImportar,
  navigationGroupsVisiveis,
  caminhoAtivo,
  grupoAtivo,
  mobileGroupOpen,
  toggleMobileGroup,
  badgePedidos,
  badgeMonitoramento,
  goTo,
  handleLogout,
  fecharMenuMobile,
}) {
  return (
    <>
      <button
        type="button"
        className="navbar-mobile-overlay"
        onClick={fecharMenuMobile}
        aria-label="Fechar menu principal"
      />

      <aside id="navbar-mobile-drawer" className="navbar-mobile-drawer" aria-label="Menu principal">
        <div className="navbar-mobile-header">
          <div>
            <span className="navbar-mobile-eyebrow">Navegação</span>

            <strong>Menu</strong>
          </div>

          <button
            type="button"
            className="navbar-mobile-close"
            onClick={fecharMenuMobile}
            aria-label="Fechar menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="navbar-mobile-user">
          <span className="navbar-mobile-avatar">{userInitials}</span>

          <div>
            <strong>{userName}</strong>

            <span>{isAdmin ? "Administrador" : "Operador"}</span>
          </div>
        </div>

        <nav className="navbar-mobile-nav" aria-label="Navegação mobile">
          {navigationGroupsVisiveis.map((item) => {
            const Icon = item.icon;

            if (item.type === "link") {
              const active = caminhoAtivo(item.path);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? "navbar-mobile-link active" : "navbar-mobile-link"}
                  onClick={() => goTo(item.path)}
                >
                  <span className="navbar-mobile-link-icon">
                    <Icon size={19} strokeWidth={2} aria-hidden="true" />
                  </span>

                  <span className="navbar-mobile-link-label">{item.label}</span>
                </button>
              );
            }

            const active = grupoAtivo(item);

            const aberto = mobileGroupOpen === item.id;

            const ehPedidos = item.id === "pedidos";

            return (
              <div key={item.id} className="navbar-mobile-group">
                <button
                  type="button"
                  className={
                    active ? "navbar-mobile-group-trigger active" : "navbar-mobile-group-trigger"
                  }
                  onClick={() => toggleMobileGroup(item.id)}
                  aria-expanded={aberto}
                >
                  <span className="navbar-mobile-link-icon">
                    <Icon size={19} strokeWidth={2} aria-hidden="true" />
                  </span>

                  <span className="navbar-mobile-link-label">{item.label}</span>

                  {ehPedidos && badgePedidos && (
                    <span className="navbar-mobile-count">{badgePedidos}</span>
                  )}

                  <ChevronDown
                    size={17}
                    strokeWidth={2.2}
                    className={aberto ? "navbar-mobile-chevron open" : "navbar-mobile-chevron"}
                    aria-hidden="true"
                  />
                </button>

                {aberto && (
                  <div className="navbar-mobile-submenu">
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
                              ? "navbar-mobile-submenu-item active"
                              : "navbar-mobile-submenu-item"
                          }
                          onClick={() => goTo(child.path)}
                        >
                          <ChildIcon size={17} strokeWidth={2} aria-hidden="true" />

                          <span>{child.label}</span>

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

        {/* ADMINISTRAÇÃO MOBILE */}

        {(podeImportar || isAdmin) && (
          <div className="navbar-mobile-admin">
            <span className="navbar-mobile-section-label">Administração</span>

            {podeImportar && (
              <button
                type="button"
                className="navbar-mobile-admin-link"
                onClick={() => goTo("/importar")}
              >
                <Upload size={18} aria-hidden="true" />

                <span>Importar dados</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  type="button"
                  className="navbar-mobile-admin-link"
                  onClick={() => goTo("/administracao")}
                >
                  <ShieldCheck size={18} aria-hidden="true" />

                  <span>Administração</span>
                </button>

                <button
                  type="button"
                  className="navbar-mobile-admin-link"
                  onClick={() => goTo("/usuarios")}
                >
                  <Users size={18} aria-hidden="true" />

                  <span>Gerenciar usuários</span>
                </button>

                <button
                  type="button"
                  className="navbar-mobile-admin-link"
                  onClick={() => goTo("/monitoramento")}
                >
                  <Activity size={18} aria-hidden="true" />

                  <span>Monitoramento</span>

                  {badgeMonitoramento && (
                    <span className="navbar-mobile-count">{badgeMonitoramento}</span>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        <div className="navbar-mobile-footer">
          <button type="button" className="navbar-mobile-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />

            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
