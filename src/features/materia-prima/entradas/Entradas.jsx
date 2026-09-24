import { AlertTriangle, PackageCheck, RefreshCw, Search } from "lucide-react";

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

  return `${Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}/kg`;
}

function formatarCustoKg(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}/kg`;
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

function normalizarTexto(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   ENTRADAS
========================================================= */

export default function Entradas() {
  const [busca, setBusca] = useState("");

  const [dataInicio, setDataInicio] = useState("");

  const [dataFim, setDataFim] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);

  const { entradas, carregando, carregado, erro, recarregar } = useEntradas();

  /* =======================================================
     FILTROS + ORDENAÇÃO
     Ordem: data de compra mais recente primeiro
  ======================================================= */

  const filtradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    return entradas
      .filter(
        (entrada) =>
          (!termo ||
            normalizarTexto(entrada.fornecedorNome).includes(termo) ||
            normalizarTexto(entrada.numeroPedido).includes(termo) ||
            normalizarTexto(entrada.materialNome).includes(termo)) &&
          (!dataInicio || entrada.data >= dataInicio) &&
          (!dataFim || entrada.data <= dataFim),
      )
      .sort((a, b) => {
        const dataCompraA = String(a.dataCompra ?? "");

        const dataCompraB = String(b.dataCompra ?? "");

        const comparacaoData = dataCompraB.localeCompare(dataCompraA);

        if (comparacaoData !== 0) {
          return comparacaoData;
        }

        return String(b.numeroPedido ?? "").localeCompare(String(a.numeroPedido ?? ""), "pt-BR", {
          numeric: true,
        });
      });
  }, [entradas, busca, dataInicio, dataFim]);

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalItens = filtradas.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, dataInicio, dataFim]);

  useEffect(() => {
    if (paginaAtual !== paginaValida) {
      setPaginaAtual(paginaValida);
    }
  }, [paginaAtual, paginaValida]);

  const paginadas = useMemo(() => {
    const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

    return filtradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [filtradas, paginaValida]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores = useMemo(() => {
    const entradasAtivas = filtradas.filter((entrada) => entrada.ativo);

    return {
      recebimentos: filtradas.length,

      totalKg: entradasAtivas.reduce(
        (total, entrada) => total + Number(entrada.quantidadeKg ?? 0),
        0,
      ),
    };
  }, [filtradas]);

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

      <div className="entradas-pp-filtros">
        <label className="entradas-pp-busca">
          <Search size={16} />

          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar fornecedor, material ou pedido..."
          />
        </label>

        <input
          type="date"
          value={dataInicio}
          onChange={(event) => setDataInicio(event.target.value)}
        />

        <input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />

        <button
          type="button"
          className="entradas-pp-atualizar"
          onClick={recarregar}
          disabled={carregando}
        >
          <RefreshCw size={16} className={carregando ? "girando" : ""} />
          Atualizar
        </button>
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

      {!carregando && !erro && filtradas.length > 0 && (
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

                    <td className="entradas-pp-quantidade">
                      {Number(entrada.quantidadeKg ?? 0).toLocaleString("pt-BR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>

                    <td className="entradas-pp-quantidade">
                      {Number(entrada.precoUnitario ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="entradas-pp-financeiro">
                      <span>{formatarPercentual(entrada.ipiPercentual)}</span>

                      {entrada.valorIpi !== null && (
                        <small>{formatarMoeda(entrada.valorIpi)}</small>
                      )}
                    </td>

                    <td className="entradas-pp-total">{formatarMoeda(entrada.valorTotal)}</td>

                    <td className="entradas-pp-quantidade">
                      {Number(entrada.custoEfetivoKg ?? 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
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

      {!carregando && !erro && entradas.length > 0 && filtradas.length === 0 && (
        <div className="entradas-pp-estado">
          <Search size={27} />

          <strong>Nenhum recebimento encontrado</strong>

          <p>Altere os filtros para visualizar outros recebimentos.</p>
        </div>
      )}
    </div>
  );
}
