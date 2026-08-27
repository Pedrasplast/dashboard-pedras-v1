import React from 'react';
import { Wrench } from 'lucide-react';
import './DashboardMateriaPrima.css';

function DashboardMateriaPrima() {
  return (
    <div className="materia-prima-layout">
      
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
          <div className="construcao-card">
            <div className="construcao-icon-wrapper">
              <Wrench size={40} className="construcao-icon animate-pulse" />
            </div>
            <h2>Módulo em Desenvolvimento</h2>
            <p>
              Estamos construindo esta seção para trazer os melhores indicadores de consumo de matéria-prima para você. Em breve estará disponível!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default DashboardMateriaPrima;