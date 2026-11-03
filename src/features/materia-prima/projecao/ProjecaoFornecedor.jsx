import { formatarKg } from "./projecaoDiaria.regras";
import { AlertTriangle } from "lucide-react";
import { formatarDataBROuOriginal } from "@/shared/lib/datas";

/* =========================================================
   CARD FORNECEDOR
========================================================= */

export function FornecedorCard({ grupo, ativo, onClick }) {
  const negativo = grupo.saldoFinalKg !== null && grupo.saldoFinalKg < 0;

  return (
    <button
      type="button"
      className={[
        "projecao-diaria-fornecedor-aba",
        ativo ? "ativo" : "",
        negativo ? "negativo" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span>{grupo.fornecedorNome}</span>

      <strong>
        {grupo.saldoFinalKg === null ? "Sem saldo-base" : formatarKg(grupo.saldoFinalKg)}
      </strong>

      <small>Consumo {formatarKg(grupo.consumoKg)}</small>
    </button>
  );
}

/* =========================================================
   DETALHE DO FORNECEDOR
========================================================= */

export function FornecedorDetalhe({ grupo }) {
  const negativo = grupo.saldoFinalKg !== null && grupo.saldoFinalKg < 0;

  return (
    <section
      className={["projecao-diaria-fornecedor-bloco", negativo ? "negativo" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="projecao-diaria-fornecedor-header">
        <div className="projecao-diaria-fornecedor-identificacao">
          <span>Fornecedor selecionado</span>

          <strong>{grupo.fornecedorNome}</strong>

          <small>{grupo.linhas.length} dia(s) projetado(s)</small>
        </div>

        <div className="projecao-diaria-fornecedor-resumo">
          <div>
            <span>Recebido</span>

            <strong className="entrada">{formatarKg(grupo.recebidoKg)}</strong>
          </div>

          <div>
            <span>Compra futura</span>

            <strong className="futura">{formatarKg(grupo.compraFuturaKg)}</strong>
          </div>

          <div>
            <span>Consumo</span>

            <strong className="consumo">{formatarKg(grupo.consumoKg)}</strong>
          </div>

          <div className="saldo-final">
            <span>Saldo final</span>

            <strong className={negativo ? "negativo" : ""}>
              {grupo.saldoFinalKg === null ? "-" : formatarKg(grupo.saldoFinalKg)}
            </strong>
          </div>
        </div>
      </div>

      {!grupo.possuiSaldoBase && (
        <div className="projecao-diaria-fornecedor-sem-base">
          <AlertTriangle size={14} />
          Este fornecedor ainda não possui saldo-base para o material selecionado.
        </div>
      )}

      <div className="projecao-diaria-tabela-container">
        <table className="projecao-diaria-tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Saldo início</th>
              <th>Recebido</th>
              <th>Compra futura</th>
              <th>Consumo</th>
              <th>Saldo final</th>
            </tr>
          </thead>

          <tbody>
            {grupo.linhas.map((linha) => (
              <tr key={`${linha.data}-${linha.fornecedorId}`}>
                <td className="projecao-diaria-data">
                  <strong>{formatarDataBROuOriginal(linha.data)}</strong>

                  {linha.saldoBaseAplicado && <small>Nova base</small>}
                </td>

                <td>
                  {linha.possuiSaldoBase ? formatarKg(linha.saldoInicioKg) : "Sem saldo-base"}
                </td>

                <td className="projecao-diaria-entrada">
                  {linha.recebidoKg > 0 ? `+ ${formatarKg(linha.recebidoKg)}` : "-"}
                </td>

                <td className="projecao-diaria-futura">
                  {linha.compraFuturaKg > 0 ? `+ ${formatarKg(linha.compraFuturaKg)}` : "-"}
                </td>

                <td className="projecao-diaria-consumo">
                  {linha.consumoKg > 0 ? `- ${formatarKg(linha.consumoKg)}` : "-"}
                </td>

                <td
                  className={[
                    "projecao-diaria-saldo",

                    linha.saldoFinalKg !== null && linha.saldoFinalKg < 0 ? "negativo" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {linha.saldoFinalKg === null ? "-" : formatarKg(linha.saldoFinalKg)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
