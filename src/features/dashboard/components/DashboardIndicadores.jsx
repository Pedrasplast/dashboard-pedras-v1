import { memo } from "react";

export const KpiSimples = memo(function KpiSimples({
  className,
  Icone,
  classeIcone,
  titulo,
  valor,
}) {
  return (
    <div className={`kpi-card ${className}`}>
      <Icone className={`kpi-icon ${classeIcone}`} />
      <span>{titulo}</span>
      <strong>{valor}</strong>
    </div>
  );
});

export const KpiHoras = memo(function KpiHoras({
  className,
  Icone,
  classeIcone,
  titulo,
  dias,
  valor,
  percentual,
  classePercentual,
}) {
  return (
    <div className={`kpi-card ${className} kpi-horas-trabalhadas`}>
      <div className="dias-trabalhados-indicador">
        <small>DIAS</small>
        <strong>{dias}</strong>
      </div>

      <Icone className={`kpi-icon ${classeIcone}`} />
      <span>{titulo}</span>

      {percentual !== undefined && percentual !== null && (
        <div className={`percentual-horas-indicador ${classePercentual || ""}`}>
          {percentual}%
        </div>
      )}

      <strong className="valor-horas-trabalhadas">{valor} hrs</strong>
    </div>
  );
});

export const MotivosParada = memo(function MotivosParada({ motivos = [] }) {
  const maiorMotivo = motivos[0]?.value || 0;

  return (
    <section className="chart-container">
      <h3>MOTIVOS DE PARADA</h3>

      <div className="motivos-list">
        {motivos.length === 0 ? (
          <p className="sem-dados">Nenhum motivo de parada encontrado.</p>
        ) : (
          motivos.map((item) => (
            <div key={item.name} className="motivo-bar">
              <div className="label-row">
                <span>{item.name}</span>
                <span>{item.formattedValue}</span>
              </div>

              <div className="progress-bg">
                <progress
                  className="progress-indicador"
                  value={Number(item.value) || 0}
                  max={maiorMotivo > 0 ? maiorMotivo : 1}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
});
