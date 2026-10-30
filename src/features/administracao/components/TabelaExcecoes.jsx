import { CalendarDays } from "lucide-react";

import { classePerfil, formatarDataPtBr, formatarDiaSemana } from "../calendarioIndustrial.regras";
import { ehFeriadoNacionalAutomatico } from "../calendarioIndustrialAdminService";

export default function TabelaExcecoes({ ano, excecoes, onAbrirDia }) {
  return (
    <section className="administracao-excecoes-section">
      <div className="administracao-section-header administracao-section-header-lista">
        <div>
          <span className="administracao-section-eyebrow">Exceções cadastradas</span>
          <h2>Alterações do ano</h2>
          <p>Feriados importados e decisões manuais que substituem o padrão de 24 horas.</p>
        </div>
      </div>

      {excecoes.length === 0 ? (
        <div className="administracao-vazio">
          <CalendarDays size={24} aria-hidden="true" />
          <strong>Nenhuma exceção cadastrada para {ano}.</strong>
          <span>Use o calendário ou sincronize os feriados nacionais.</span>
        </div>
      ) : (
        <div className="administracao-tabela-wrap">
          <table className="administracao-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Origem</th>
                <th>Configuração</th>
                <th>Observação</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {excecoes.map((item) => {
                const automatico = ehFeriadoNacionalAutomatico(item);

                return (
                  <tr key={item.data}>
                    <td>
                      <strong>{formatarDataPtBr(item.data)}</strong>
                      <span className="administracao-tabela-secundario">
                        {formatarDiaSemana(item.data)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          automatico
                            ? "administracao-origem-badge automatico"
                            : "administracao-origem-badge manual"
                        }
                      >
                        {automatico ? "Feriado nacional" : "Manual"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`administracao-perfil-badge ${classePerfil(item.perfil_codigo)}`}
                      >
                        {item.perfil_codigo === "SEM_PRODUCAO"
                          ? "SEM PRODUÇÃO"
                          : item.perfil_codigo}
                      </span>
                    </td>
                    <td className="administracao-observacao-col">{item.observacao || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="administracao-editar-btn"
                        onClick={() => onAbrirDia(item.data)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
