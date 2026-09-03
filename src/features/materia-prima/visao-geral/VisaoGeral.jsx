import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Factory,
  PackageOpen,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  Warehouse,
} from "lucide-react";

import useVisaoGeral from "./useVisaoGeral";

import "./VisaoGeral.css";

/* =========================================================
   FORMATADORES
========================================================= */

function formatarKg(valor) {
  return `${Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`;
}

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) {
    return valor;
  }

  return `${dia}/${mes}/${ano}`;
}

/* =========================================================
   VISÃO GERAL
========================================================= */

export default function VisaoGeral() {
  const {
    hoje,
    dataFim,

    saldoHojeKg,

    consumoHojeKg,

    saldoFimPeriodoKg,

    consumoPeriodoKg,

    comprasAbertasQuantidade,

    comprasAbertasKg,

    fornecedoresEmRiscoQuantidade,

    primeiraRupturaData,

    primeiraRupturaFornecedor,

    resumoFornecedores,

    fornecedoresSemSaldo,

    programacoesSemReceita,

    carregando,

    carregado,

    erro,

    recarregar,
  } = useVisaoGeral();

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="visao-geral-pp">
      {/* =================================================
          TOPO
      ================================================= */}

      <div className="visao-geral-pp-topo">
        <div>
          <strong>Situação da matéria-prima</strong>

          <p>Resumo calculado de hoje até {formatarData(dataFim)}.</p>
        </div>

        <button
          type="button"
          className="visao-geral-pp-atualizar"
          onClick={recarregar}
          disabled={carregando}
        >
          <RefreshCw size={16} className={carregando ? "girando" : ""} />
          Atualizar
        </button>
      </div>

      {/* =================================================
          CARREGANDO
      ================================================= */}

      {carregando && !carregado && (
        <div className="visao-geral-pp-estado">
          <span className="visao-geral-pp-loading" />

          <strong>Calculando situação do PP</strong>

          <p>Cruzando estoque-base, programação, compras e receitas.</p>
        </div>
      )}

      {/* =================================================
          ERRO
      ================================================= */}

      {!carregando && erro && (
        <div className="visao-geral-pp-estado visao-geral-pp-erro">
          <AlertTriangle size={32} />

          <strong>Não foi possível carregar</strong>

          <p>{erro}</p>
        </div>
      )}

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      {!erro && carregado && (
        <>
          {/* ===============================================
              INDICADORES PRINCIPAIS
          =============================================== */}

          <div className="visao-geral-pp-indicadores">
            <div className="visao-geral-pp-card">
              <div className="visao-geral-pp-card-icone">
                <Warehouse size={19} />
              </div>

              <div>
                <span>Saldo projetado hoje</span>

                <strong className={saldoHojeKg < 0 ? "negativo" : ""}>
                  {formatarKg(saldoHojeKg)}
                </strong>

                <small>Fechamento projetado de {formatarData(hoje)}</small>
              </div>
            </div>

            <div className="visao-geral-pp-card">
              <div className="visao-geral-pp-card-icone consumo">
                <Factory size={19} />
              </div>

              <div>
                <span>Consumo de hoje</span>

                <strong>{formatarKg(consumoHojeKg)}</strong>

                <small>Conforme programação</small>
              </div>
            </div>

            <div className="visao-geral-pp-card">
              <div className="visao-geral-pp-card-icone compra">
                <ShoppingCart size={19} />
              </div>

              <div>
                <span>PP a receber</span>

                <strong>{formatarKg(comprasAbertasKg)}</strong>

                <small>{comprasAbertasQuantidade} compra(s) aberta(s)</small>
              </div>
            </div>

            <div className="visao-geral-pp-card">
              <div
                className={
                  fornecedoresEmRiscoQuantidade > 0
                    ? "visao-geral-pp-card-icone risco"
                    : "visao-geral-pp-card-icone ok"
                }
              >
                {fornecedoresEmRiscoQuantidade > 0 ? (
                  <TrendingDown size={19} />
                ) : (
                  <CheckCircle2 size={19} />
                )}
              </div>

              <div>
                <span>Fornecedores em risco</span>

                <strong className={fornecedoresEmRiscoQuantidade > 0 ? "negativo" : ""}>
                  {fornecedoresEmRiscoQuantidade}
                </strong>

                <small>Ruptura nos próximos 30 dias</small>
              </div>
            </div>
          </div>

          {/* ===============================================
              PROJEÇÃO 30 DIAS
          =============================================== */}

          <div className="visao-geral-pp-faixa">
            <div>
              <span>Consumo programado — 30 dias</span>

              <strong>{formatarKg(consumoPeriodoKg)}</strong>
            </div>

            <div>
              <span>Saldo no final do período</span>

              <strong className={saldoFimPeriodoKg < 0 ? "negativo" : ""}>
                {formatarKg(saldoFimPeriodoKg)}
              </strong>
            </div>

            <div>
              <span>Próxima ruptura</span>

              {primeiraRupturaData ? (
                <>
                  <strong className="negativo">{formatarData(primeiraRupturaData)}</strong>

                  <small>{primeiraRupturaFornecedor}</small>
                </>
              ) : (
                <>
                  <strong className="positivo">Sem ruptura</strong>

                  <small>No período analisado</small>
                </>
              )}
            </div>
          </div>

          {/* ===============================================
              ALERTAS
          =============================================== */}

          {fornecedoresSemSaldo.length > 0 && (
            <div className="visao-geral-pp-alerta">
              <AlertTriangle size={18} />

              <div>
                <strong>Fornecedor sem saldo-base</strong>

                <p>{fornecedoresSemSaldo.map((fornecedor) => fornecedor.nome).join(", ")}</p>
              </div>
            </div>
          )}

          {programacoesSemReceita.length > 0 && (
            <div className="visao-geral-pp-alerta">
              <AlertTriangle size={18} />

              <div>
                <strong>Programação sem receita</strong>

                <p>
                  Existem produtos programados cujo consumo não foi distribuído entre os
                  fornecedores.
                </p>
              </div>
            </div>
          )}

          {/* ===============================================
              FORNECEDORES
          =============================================== */}

          <div className="visao-geral-pp-secao-header">
            <div>
              <PackageOpen size={18} />

              <div>
                <strong>Situação por fornecedor</strong>

                <p>Saldo, compras previstas e risco de ruptura.</p>
              </div>
            </div>
          </div>

          {resumoFornecedores.length === 0 ? (
            <div className="visao-geral-pp-estado compacto">
              <PackageOpen size={30} />

              <strong>Nenhum fornecedor para analisar</strong>
            </div>
          ) : (
            <div className="visao-geral-pp-fornecedores">
              {resumoFornecedores.map((fornecedor) => (
                <article
                  key={fornecedor.id}
                  className={
                    fornecedor.dataRuptura
                      ? "visao-geral-pp-fornecedor risco"
                      : "visao-geral-pp-fornecedor"
                  }
                >
                  <div className="visao-geral-pp-fornecedor-topo">
                    <div>
                      <strong>{fornecedor.nome}</strong>

                      {!fornecedor.possuiSaldoBase && (
                        <span className="visao-geral-pp-badge aviso">Sem saldo-base</span>
                      )}
                    </div>

                    {fornecedor.dataRuptura ? (
                      <span className="visao-geral-pp-badge ruptura">
                        <TrendingDown size={12} />
                        Ruptura {formatarData(fornecedor.dataRuptura)}
                      </span>
                    ) : (
                      <span className="visao-geral-pp-badge normal">
                        <CheckCircle2 size={12} />
                        Sem ruptura
                      </span>
                    )}
                  </div>

                  <div className="visao-geral-pp-fornecedor-dados">
                    <div>
                      <span>Saldo hoje</span>

                      <strong className={Number(fornecedor.saldoHojeKg) < 0 ? "negativo" : ""}>
                        {fornecedor.saldoHojeKg === null ? "-" : formatarKg(fornecedor.saldoHojeKg)}
                      </strong>
                    </div>

                    <div>
                      <span>Saldo em 30 dias</span>

                      <strong
                        className={Number(fornecedor.saldoFimPeriodoKg) < 0 ? "negativo" : ""}
                      >
                        {fornecedor.saldoFimPeriodoKg === null
                          ? "-"
                          : formatarKg(fornecedor.saldoFimPeriodoKg)}
                      </strong>
                    </div>

                    <div>
                      <span>Compras abertas</span>

                      <strong>{formatarKg(fornecedor.comprasAbertasKg)}</strong>
                    </div>

                    <div>
                      <span>Próxima entrega</span>

                      <strong>
                        {fornecedor.proximaEntrega ? formatarData(fornecedor.proximaEntrega) : "-"}
                      </strong>
                    </div>
                  </div>

                  {fornecedor.dataRuptura && (
                    <div className="visao-geral-pp-fornecedor-alerta">
                      <CalendarClock size={15} />

                      <span>
                        Estoque projetado negativo em{" "}
                        <strong>{formatarData(fornecedor.dataRuptura)}</strong>
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
