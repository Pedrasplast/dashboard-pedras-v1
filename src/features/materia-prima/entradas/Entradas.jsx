import { AlertTriangle, PackageCheck } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import useEntradas from "./useEntradas";

import Paginacao from "@/components/paginacao/Paginacao";

import "./Entradas.css";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const ITENS_POR_PAGINA = 8;

/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = valor.split("-");

  return `${dia}/${mes}/${ano}`;
}

function formatarKg(valor) {
  return `${Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} kg`;
}

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarPrecoKg(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarCustoKg(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function formatarPercentual(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/* =========================================================
   ENTRADAS
========================================================= */

export default function Entradas() {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const { entradas, carregando, carregado, erro } = useEntradas();

  /* =======================================================
     ORDENAÇÃO

     Data da compra mais recente primeiro.
     Em empate, maior número de pedido primeiro.
  ======================================================= */

  const ordenadas = useMemo(
    () =>
      [...entradas].sort((a, b) => {
        const dataCompraA = String(a.dataCompra ?? "");

        const dataCompraB = String(b.dataCompra ?? "");

        const comparacaoData = dataCompraB.localeCompare(dataCompraA);

        if (comparacaoData !== 0) {
          return comparacaoData;
        }

        return String(b.numeroPedido ?? "").localeCompare(String(a.numeroPedido ?? ""), "pt-BR", {
          numeric: true,
        });
      }),
    [entradas],
  );

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalItens = ordenadas.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

  useEffect(() => {
    if (paginaAtual !== paginaValida) {
      setPaginaAtual(paginaValida);
    }
  }, [paginaAtual, paginaValida]);

  const paginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

    return ordenadas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [ordenadas, paginaValida]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores = useMemo(() => {
    const entradasAtivas = entradas.filter((entrada) => entrada.ativo);

    return {
      recebimentos: entradas.length,

      totalKg: entradasAtivas.reduce(
        (total, entrada) => total + Number(entrada.quantidadeKg ?? 0),
        0,
      ),
    };
  }, [entradas]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="entradas-pp">
      <div className="entradas-pp-toolbar">
        <div className="entradas-pp-indicadores">
          <div>
            <span>Recebimentos</span>

            <strong>{indicadores.recebimentos}</strong>
          </div>

          <div>
            <span>Total recebido</span>

            <strong>{formatarKg(indicadores.totalKg)}</strong>
          </div>
        </div>
      </div>

      {carregando && (
        <div className="entradas-pp-estado">
          <span className="entradas-pp-loading" />

          <strong>Carregando recebimentos</strong>
        </div>
      )}

      {!carregando && erro && (
        <div className="entradas-pp-estado entradas-pp-erro">
          <AlertTriangle size={30} />

          <strong>Erro ao carregar entradas</strong>

          <p>{erro}</p>
        </div>
      )}

      {!carregando && !erro && carregado && entradas.length === 0 && (
        <div className="entradas-pp-estado">
          <PackageCheck size={34} />

          <strong>Nenhum material recebido</strong>

          <p>Quando uma compra for alterada para Recebida, ela aparecerá automaticamente aqui.</p>
        </div>
      )}

      {!carregando && !erro && ordenadas.length > 0 && (
        <>
          <div className="entradas-pp-tabela-container">
            <table className="entradas-pp-tabela">
              <thead>
                <tr>
                  <th>Pedido (OC)</th>

                  <th>Recebido</th>

                  <th>Emissão</th>

                  <th>Previsão Recebimento</th>

                  <th>Fornecedor</th>

                  <th>Material</th>

                  <th>Tipo</th>

                  <th>Quantidade(kg)</th>

                  <th>Preço/kg</th>

                  <th>IPI</th>

                  <th>Total</th>

                  <th>Custo/kg</th>

                  <th>Observação</th>
                </tr>
              </thead>

              <tbody>
                {paginadas.map((entrada) => (
                  <tr key={entrada.id}>
                    <td>
                      <strong>{entrada.numeroPedido || "-"}</strong>
                    </td>

                    <td className="entradas-pp-data">{formatarData(entrada.data)}</td>

                    <td>{formatarData(entrada.dataCompra)}</td>

                    <td>{formatarData(entrada.dataPrevista)}</td>

                    <td className="entradas-pp-fornecedor">
                      <strong>{entrada.fornecedorNome}</strong>
                    </td>

                    <td>
                      <strong>{entrada.materialNome || "-"}</strong>
                    </td>

                    <td>
                      <strong>{entrada.tipoClassificacao || "-"}</strong>
                    </td>

                    <td className="entradas-pp-quantidade">
                      {Number(entrada.quantidadeKg ?? 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>

                    <td className="entradas-pp-quantidade">
                      {formatarPrecoKg(entrada.precoUnitario)}
                    </td>

                    <td className="entradas-pp-financeiro">
                      <span>{formatarPercentual(entrada.ipiPercentual)}</span>

                      {entrada.valorIpi !== null && (
                        <small>{formatarMoeda(entrada.valorIpi)}</small>
                      )}
                    </td>

                    <td className="entradas-pp-total">{formatarMoeda(entrada.valorTotal)}</td>

                    <td className="entradas-pp-quantidade">
                      {formatarCustoKg(entrada.custoEfetivoKg)}
                    </td>

                    <td className="entradas-pp-observacao">{entrada.observacao || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <Paginacao
              paginaAtual={paginaValida}
              totalItens={totalItens}
              itensPorPagina={ITENS_POR_PAGINA}
              onChangePagina={setPaginaAtual}
            />
          )}
        </>
      )}
    </div>
  );
}
