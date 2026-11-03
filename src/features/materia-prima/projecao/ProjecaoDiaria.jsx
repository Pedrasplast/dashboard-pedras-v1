import { AlertTriangle, CalendarDays, TrendingDown } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import useProjecao from "./useProjecao";
import { paraNumero } from "@/shared/lib/numeros";

import "./ProjecaoDiaria.css";
import { dataLocal, formatarKg, agruparPorFornecedor } from "./projecaoDiaria.regras";
import { FornecedorCard, FornecedorDetalhe } from "./ProjecaoFornecedor";

/* =========================================================
   PROJEÇÃO DIÁRIA
========================================================= */

export default function ProjecaoDiaria() {
  const [dataInicio, setDataInicio] = useState(() => dataLocal());

  const [dataFim, setDataFim] = useState(() => dataLocal(10));

  const [materialId, setMaterialId] = useState("1");

  const [fornecedorSelecionadoId, setFornecedorSelecionadoId] = useState("");

  const {
    linhas,
    materiais,
    fornecedoresSemSaldo,
    consumoProgramadoDisponivel,
    programacoesSemReceita,
    carregando,
    carregado,
    erro,
  } = useProjecao({
    dataInicio,
    dataFim,
    materialId,
  });

  /* =======================================================
     FORNECEDORES
  ======================================================= */

  const grupos = useMemo(() => agruparPorFornecedor(linhas), [linhas]);

  useEffect(() => {
    if (!grupos.length) {
      setFornecedorSelecionadoId("");
      return;
    }

    const existe = grupos.some(
      (grupo) => String(grupo.fornecedorId) === String(fornecedorSelecionadoId),
    );

    if (!existe) {
      setFornecedorSelecionadoId(String(grupos[0].fornecedorId));
    }
  }, [grupos, fornecedorSelecionadoId]);

  const fornecedorSelecionado = useMemo(
    () =>
      grupos.find((grupo) => String(grupo.fornecedorId) === String(fornecedorSelecionadoId)) ??
      grupos[0] ??
      null,
    [grupos, fornecedorSelecionadoId],
  );

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores = useMemo(
    () => ({
      saldoFinalKg: grupos.reduce((total, grupo) => total + paraNumero(grupo.saldoFinalKg), 0),

      recebidoKg: grupos.reduce((total, grupo) => total + grupo.recebidoKg, 0),

      compraFuturaKg: grupos.reduce((total, grupo) => total + grupo.compraFuturaKg, 0),

      consumoKg: grupos.reduce((total, grupo) => total + grupo.consumoKg, 0),

      negativos: grupos.filter((grupo) => grupo.saldoFinalKg !== null && grupo.saldoFinalKg < 0)
        .length,
    }),
    [grupos],
  );

  return (
    <div className="projecao-diaria">
      {/* FILTROS */}

      <div className="projecao-diaria-filtros">
        <div className="projecao-diaria-periodo">
          <CalendarDays size={17} aria-hidden="true" />

          <label>
            <span>Início</span>

            <input
              type="date"
              value={dataInicio}
              onChange={(event) => {
                const valor = event.target.value;

                setDataInicio(valor);

                if (valor && dataFim < valor) {
                  const data = new Date(`${valor}T12:00:00`);

                  data.setDate(data.getDate() + 10);

                  const ano = data.getFullYear();

                  const mes = String(data.getMonth() + 1).padStart(2, "0");

                  const dia = String(data.getDate()).padStart(2, "0");

                  setDataFim(`${ano}-${mes}-${dia}`);
                }
              }}
            />
          </label>

          <label>
            <span>Fim</span>

            <input
              type="date"
              min={dataInicio}
              value={dataFim}
              onChange={(event) => setDataFim(event.target.value)}
            />
          </label>
        </div>

        <label className="projecao-diaria-material">
          <span>Material</span>

          <select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
            {materiais
              .filter((material) => material.ativo !== false)
              .map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nome}
                </option>
              ))}
          </select>

          <small>
            {carregando
              ? "Atualizando projeção automaticamente..."
              : "A atualização é automática ao alterar período ou material."}
          </small>
        </label>
      </div>

      {/* INDICADORES */}

      <div className="projecao-diaria-indicadores">
        <div>
          <span>Saldo final total</span>

          <strong className={indicadores.saldoFinalKg < 0 ? "negativo" : ""}>
            {formatarKg(indicadores.saldoFinalKg)}
          </strong>
        </div>

        <div>
          <span>Recebido no período</span>

          <strong>{formatarKg(indicadores.recebidoKg)}</strong>
        </div>

        <div>
          <span>Compras futuras</span>

          <strong>{formatarKg(indicadores.compraFuturaKg)}</strong>
        </div>

        <div>
          <span>Consumo programado</span>

          <strong>{formatarKg(indicadores.consumoKg)}</strong>
        </div>
      </div>

      {/* ALERTAS */}

      {indicadores.negativos > 0 && (
        <div className="projecao-diaria-alerta negativo">
          <TrendingDown size={18} />

          <div>
            <strong>Estoque negativo previsto</strong>

            <p>
              {indicadores.negativos} fornecedor(es) terminarão o período selecionado com saldo
              projetado negativo.
            </p>
          </div>
        </div>
      )}

      {fornecedoresSemSaldo.length > 0 && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>Fornecedor sem saldo-base</strong>

            <p>{fornecedoresSemSaldo.map((fornecedor) => fornecedor.nome).join(", ")}</p>
          </div>
        </div>
      )}

      {!consumoProgramadoDisponivel && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>Consumo programado disponível para PP</strong>

            <p>
              O consumo permanece zerado enquanto não houver receita configurada para o material
              selecionado.
            </p>
          </div>
        </div>
      )}

      {programacoesSemReceita.length > 0 && (
        <div className="projecao-diaria-alerta">
          <AlertTriangle size={18} />

          <div>
            <strong>Programação sem receita de PP</strong>

            <p>Existem dias programados sem receita. Revise Cadastro → Receita e Programação.</p>
          </div>
        </div>
      )}

      {/* CARREGAMENTO */}

      {carregando && (
        <div className="projecao-diaria-estado">
          <span className="projecao-diaria-loading" />

          <strong>Calculando projeção</strong>

          <p>Cruzando estoque, compras, programação e receitas.</p>
        </div>
      )}

      {/* ERRO */}

      {!carregando && erro && (
        <div className="projecao-diaria-estado projecao-diaria-erro">
          <AlertTriangle size={30} />

          <strong>Não foi possível calcular a projeção</strong>

          <p>{erro}</p>
        </div>
      )}

      {/* FORNECEDORES */}

      {!carregando && !erro && carregado && grupos.length > 0 && fornecedorSelecionado && (
        <div className="projecao-diaria-fornecedores">
          <section className="projecao-diaria-fornecedor-navegador">
            <div className="projecao-diaria-fornecedor-navegador-topo">
              <div>
                <span>Fornecedores</span>

                <strong>Escolha um fornecedor para analisar</strong>

                <small>A tabela mostra apenas o fornecedor selecionado.</small>
              </div>

              <label className="projecao-diaria-fornecedor-select">
                <span>Ir para fornecedor</span>

                <select
                  value={String(fornecedorSelecionado.fornecedorId)}
                  onChange={(event) => setFornecedorSelecionadoId(event.target.value)}
                >
                  {grupos.map((grupo) => (
                    <option key={grupo.fornecedorId} value={grupo.fornecedorId}>
                      {grupo.fornecedorNome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="projecao-diaria-fornecedor-abas">
              {grupos.map((grupo) => (
                <FornecedorCard
                  key={grupo.fornecedorId}
                  grupo={grupo}
                  ativo={String(grupo.fornecedorId) === String(fornecedorSelecionado.fornecedorId)}
                  onClick={() => setFornecedorSelecionadoId(String(grupo.fornecedorId))}
                />
              ))}
            </div>
          </section>

          <FornecedorDetalhe grupo={fornecedorSelecionado} />
        </div>
      )}

      {/* SEM DADOS */}

      {!carregando && !erro && carregado && grupos.length === 0 && (
        <div className="projecao-diaria-estado">
          <CalendarDays size={32} />

          <strong>Nenhum dado para projetar</strong>

          <p>Verifique saldo-base, programação, receitas e compras.</p>
        </div>
      )}
    </div>
  );
}
