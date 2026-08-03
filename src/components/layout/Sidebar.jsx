import React from 'react';

import './Sidebar.css';

/*
 * Sidebar de layout com título e espaço livre
 * para filtros, menus e outros conteúdos.
 */
function Sidebar({
  titulo = 'Pedrasplast',
  children
}) {
  return (
    <aside className="sidebar">
      <h2 className="brand-title">
        {titulo}
      </h2>

      <div className="sidebar-content">
        {children}
      </div>
    </aside>
  );
}

export default Sidebar;