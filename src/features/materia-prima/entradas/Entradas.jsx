import { AlertTriangle, PackageCheck, RotateCcw } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import Paginacao from "@/components/paginacao/Paginacao";

import useEntradas from "./useEntradas";

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

  const [fornecedorFiltro, setFornecedorFiltro] = useState("TODOS");

  const [materialFiltro, setMaterialFiltro] = useState("TODOS");

  const [tipoFiltro, setTipoFiltro] = useState("TODOS");

  const [periodoPor, setPeriodoPor] = useState("RECEBIDO");

  const [dataDe, setDataDe] = useState("");

  const [dataAte, setDataAte] = useState("");

  const { entradas, carregando, carregado, erro } = useEntradas();

  /* =======================================================
     FORNECEDORES
  ======================================================= */

  const fornecedores = useMemo(() => {
    const mapa = new Map();

    entradas.forEach((entrada) => {
      if (entrada.fornecedorId === null || entrada.fornecedorId === undefined) {
        return;
      }

      mapa.set(String(entrada.fornecedorId), entrada.fornecedorNome || "Fornecedor não encontrado");
    });

    return Array.from(mapa.entries())
      .map(([id, nome]) => ({
        id,
        nome,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [entradas]);

  /* =======================================================
     MATERIAIS
  ======================================================= */

  const materiais = useMemo(() => {
    const mapa = new Map();

    entradas.forEach((entrada) => {
      if (entrada.materialId === null || entrada.materialId === undefined) {
        return;
      }

      mapa.set(String(entrada.materialId), entrada.materialNome || "Material não encontrado");
    });

    return Array.from(mapa.entries())
      .map(([id, nome]) => ({
        id,
        nome,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [entradas]);

  /* =======================================================
     TIPOS
  ======================================================= */

  const tipos = useMemo(
    () =>
      Array.from(
        new Set(
          entradas.map((entrada) => String(entrada.tipoClassificacao ?? "").trim()).filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [entradas],
  );

  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    setFornecedorFiltro("TODOS");

    setMaterialFiltro("TODOS");

    setTipoFiltro("TODOS");

    setPeriodoPor("RECEBIDO");

    setDataDe("");

    setDataAte("");

    setPaginaAtual(1);
  }

  const possuiFiltroAtivo =
    fornecedorFiltro !== "TODOS" ||
    materialFiltro !== "TODOS" ||
    tipoFiltro !== "TODOS" ||
    periodoPor !== "RECEBIDO" ||
    Boolean(dataDe) ||
    Boolean(dataAte);

  /* =======================================================
     DESCRIÇÃO DO PERÍODO
  ======================================================= */

  const descricaoPeriodo = useMemo(() => {
    const campo = periodoPor === "EMISSAO" ? "data de emissão" : "data de recebimento";

    if (!dataDe && !dataAte) {
      return `Sem período definido: considerando todo o histórico pela ${campo}.`;
    }

    if (dataDe && dataAte) {
      return `Período de ${formatarData(dataDe)} até ${formatarData(
        dataAte,
      )}, considerando a ${campo}.`;
    }

    if (dataDe) {
      return `Considerando registros a partir de ${formatarData(dataDe)}, pela ${campo}.`;
    }

    return `Considerando registros até ${formatarData(dataAte)}, pela ${campo}.`;
  }, [periodoPor, dataDe, dataAte]);

  /* =======================================================
     FILTROS
  ======================================================= */

  const filtradas = useMemo(
    () =>
      entradas
        .filter((entrada) => {
          const fornecedorOk =
            fornecedorFiltro === "TODOS" || String(entrada.fornecedorId) === fornecedorFiltro;

          const materialOk =
            materialFiltro === "TODOS" || String(entrada.materialId) === materialFiltro;

          const tipoOk =
            tipoFiltro === "TODOS" || String(entrada.tipoClassificacao ?? "").trim() === tipoFiltro;

          const dataReferencia =
            periodoPor === "EMISSAO"
              ? String(entrada.dataCompra ?? "")
              : String(entrada.data ?? "");

          const periodoOk =
            (!dataDe || (dataReferencia && dataReferencia >= dataDe)) &&
            (!dataAte || (dataReferencia && dataReferencia <= dataAte));

          return fornecedorOk && materialOk && tipoOk && periodoOk;
        })
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
        }),
    [entradas, fornecedorFiltro, materialFiltro, tipoFiltro, periodoPor, dataDe, dataAte],
  );

  /* =======================================================
     REINICIAR PÁGINA
  ======================================================= */

  useEffect(() => {
    setPaginaAtual(1);
  }, [fornecedorFiltro, materialFiltro, tipoFiltro, periodoPor, dataDe, dataAte]);

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalItens = filtradas.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

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
      recebimentos: entradasAtivas.length,

      totalKg: entradasAtivas.reduce(
        (total, entrada) => total + Number(entrada.quantidadeKg ?? 0),
        0,
      ),

      totalValor: entradasAtivas.reduce(
        (total, entrada) => total + Number(entrada.valorTotal ?? 0),
        0,
      ),
    };
  }, [filtradas]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="entradas-pp">
      {/* ===================================================
          CARDS + FILTROS
      =================================================== */}

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

          <div>
            <span>Valor total recebido</span>

            <strong>{formatarMoeda(indicadores.totalValor)}</strong>
          </div>
        </div>

        <div className="entradas-pp-filtros">
          <label>
            <span>Fornecedor</span>

            <select
              value={fornecedorFiltro}
              onChange={(event) => setFornecedorFiltro(event.target.value)}
            >
              <option value="TODOS">Todos os fornecedores</option>

              {fornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Matéria-prima</span>

            <select
              value={materialFiltro}
              onChange={(event) => setMaterialFiltro(event.target.value)}
            >
              <option value="TODOS">Todas as matérias-primas</option>

              {materiais.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="entradas-pp-filtro-tipo">
            <span>Tipo</span>

            <select value={tipoFiltro} onChange={(event) => setTipoFiltro(event.target.value)}>
              <option value="TODOS">Todos os tipos</option>

              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ===================================================
          PERÍODO
      =================================================== */}

      <div className="entradas-pp-periodo">
        <label className="entradas-pp-periodo-tipo">
          <span>Filtrar período por</span>

          <select value={periodoPor} onChange={(event) => setPeriodoPor(event.target.value)}>
            <option value="RECEBIDO">Data de recebimento</option>

            <option value="EMISSAO">Data de emissão</option>
          </select>
        </label>

        <div className="entradas-pp-periodo-info">{descricaoPeriodo}</div>

        <div className="entradas-pp-periodo-datas">
          <label>
            <span>De</span>

            <input
              type="date"
              value={dataDe}
              max={dataAte || undefined}
              onChange={(event) => setDataDe(event.target.value)}
            />
          </label>

          <label>
            <span>Até</span>

            <input
              type="date"
              value={dataAte}
              min={dataDe || undefined}
              onChange={(event) => setDataAte(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="entradas-pp-limpar"
            onClick={limparFiltros}
            disabled={!possuiFiltroAtivo}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Limpar filtros
          </button>
        </div>
      </div>

      {/* ===================================================
          CARREGANDO
      =================================================== */}

      {carregando && (
        <div className="entradas-pp-estado">
          <span className="entradas-pp-loading" />

          <strong>Carregando recebimentos</strong>
        </div>
      )}

      {/* ===================================================
          ERRO
      =================================================== */}

      {!carregando && erro && (
        <div className="entradas-pp-estado entradas-pp-erro">
          <AlertTriangle size={30} />

          <strong>Erro ao carregar entradas</strong>

          <p>{erro}</p>
        </div>
      )}

      {/* ===================================================
          SEM ENTRADAS
      =================================================== */}

      {!carregando && !erro && carregado && entradas.length === 0 && (
        <div className="entradas-pp-estado">
          <PackageCheck size={34} />

          <strong>Nenhum material recebido</strong>

          <p>Quando uma compra for alterada para Recebida, ela aparecerá automaticamente aqui.</p>
        </div>
      )}

      {/* ===================================================
          SEM RESULTADO
      =================================================== */}

      {!carregando && !erro && entradas.length > 0 && filtradas.length === 0 && (
        <div className="entradas-pp-estado">
          <PackageCheck size={34} />

          <strong>Nenhum recebimento encontrado</strong>

          <p>Não há entradas para os filtros selecionados.</p>
        </div>
      )}

      {/* ===================================================
          TABELA
      =================================================== */}

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
