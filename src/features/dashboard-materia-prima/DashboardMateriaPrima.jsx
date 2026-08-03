import React from 'react';

import Sidebar from '@/components/layout/Sidebar';

import './DashboardMateriaPrima.css';

function DashboardMateriaPrima() {
  return (
    <div className="materia-prima-layout">
      <Sidebar titulo="Matéria-prima">
        <div className="materia-prima-filtros">
          Filtros da matéria-prima
        </div>
      </Sidebar>

      <main className="materia-prima-main">
        <header className="materia-prima-header">
          <span className="materia-prima-subtitle">
            Controle de consumo
          </span>

          <h1>
            Dashboard de Matéria-Prima
          </h1>
        </header>

        <section className="materia-prima-content">
          <p>
            Os indicadores de matéria-prima serão exibidos aqui.
          </p>
        </section>
      </main>
    </div>
  );
}

export default DashboardMateriaPrima;