import React from 'react';
import { Wrench } from 'lucide-react';

import './DashboardProdutividade.css';

function DashboardProdutividade() {
  return (
    <div className="produtividade-layout">
      <main className="produtividade-main">
        <header className="produtividade-header">
          <span className="produtividade-subtitle">
            Controle de produtividade
          </span>

          <h1>Dashboard de Produtividade</h1>
        </header>

        <section className="produtividade-content">
          <div className="construcao-card">
            <div className="construcao-icon-wrapper">
              <Wrench
                size={40}
                className="construcao-icon animate-pulse"
              />
            </div>

            <h2>Módulo em Desenvolvimento</h2>

            <p>
              Estamos construindo esta seção para trazer os melhores
              indicadores de produtividade para você. Em breve estará
              disponível!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardProdutividade;