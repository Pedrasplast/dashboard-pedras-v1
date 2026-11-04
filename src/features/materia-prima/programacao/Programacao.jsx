import { AlertTriangle, CalendarDays, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { useMemo, useState } from "react";

import ConfirmacaoExclusao from "@/components/ConfirmacaoExclusao/ConfirmacaoExclusao";

import ProgramacaoModal from "./ProgramacaoModal";
import useProgramacao from "./useProgramacao";

import "./Programacao.css";
import {
  formatarNumero as formatarNumeroBase,
  formatarKg as formatarKgBase,
} from "@/shared/lib/formatar";
import Spinner from "@/shared/ui/Spinner";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatarNumero(valor, casas = 0) {
  return formatarNumeroBase(valor ?? 0, { casas });
}

/* "AAAA-MM-DD" → "DD/MM" */
function formatarDiaMes(dataISO) {
  const [, mes, dia] = String(dataISO ?? "").split("-");

  return dia && mes ? `${dia}/${mes}` : "";
}

function formatarKg(valor) {
  return formatarKgBase(valor ?? 0, { casas: 3 });
}

/* =========================================================
   PROGRAMAÇÃO
========================================================= */

export default function Programacao() {
  const [modalAberto, setModalAberto] = useState(false);

  const [itemEmEdicao, setItemEmEdicao] = useState(null);

  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const [erroExclusao, setErroExclusao] = useState("");

  const {
    programacao,
    produtos,
    receitas,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    recarregar,
    salvarProgramacao,
    excluirProgramacao,
    itemEstaSalvando,
    itemEstaExcluindo,
  } = useProgramacao();

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores = useMemo(() => {
    const ativos = programacao.filter((item) => item.ativo);

    return {
      registros: ativos.length,

      pecasPeriodo: ativos.reduce((total, item) => total + Number(item.pecasPrevistas ?? 0), 0),

      consumoPeriodoKg: ativos.reduce(
        (total, item) => total + Number(item.consumoPeriodoKg ?? 0),
        0,
      ),
    };
  }, [programacao]);

  /* =======================================================
     NOVO
  ======================================================= */

  function abrirNovo() {
    if (salvando || excluindo) {
      return;
    }

    setItemEmEdicao(null);

    setModalAberto(true);
  }

  /* =======================================================
     EDITAR
  ======================================================= */

  function abrirEdicao(item) {
    if (!item || salvando || excluindo) {
      return;
    }

    setItemEmEdicao(item);

    setModalAberto(true);
  }

  /* =======================================================
     FECHAR MODAL
  ======================================================= */

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);

    setItemEmEdicao(null);
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(dados) {
    const resultado = await salvarProgramacao(dados);

    setModalAberto(false);

    setItemEmEdicao(null);

    return resultado;
  }

  /* =======================================================
     SOLICITAR EXCLUSÃO
  ======================================================= */

  function solicitarExclusao(item) {
    if (!item || salvando || excluindo) {
      return;
    }

    setErroExclusao("");

    setItemParaExcluir(item);
  }

  /* =======================================================
     CANCELAR EXCLUSÃO
  ======================================================= */

  function cancelarExclusao() {
    if (excluindo) {
      return;
    }

    setErroExclusao("");

    setItemParaExcluir(null);
  }

  /* =======================================================
     CONFIRMAR EXCLUSÃO
  ======================================================= */

  async function confirmarExclusao() {
    if (!itemParaExcluir || salvando || excluindo) {
      return;
    }

    setErroExclusao("");

    try {
      await excluirProgramacao(itemParaExcluir.id);

      setItemParaExcluir(null);
    } catch (error) {
      setErroExclusao(error?.message || "Não foi possível excluir a programação.");
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="programacao-pp">
        <div className="programacao-pp-toolbar">
          <div className="programacao-pp-indicadores">
            <div>
              <span>Programações</span>

              <strong>{indicadores.registros}</strong>
            </div>

            <div>
              <span>Peças previstas</span>

              <strong>{formatarNumero(indicadores.pecasPeriodo)}</strong>
            </div>

            <div>
              <span>Consumo previsto</span>

              <strong>{formatarKg(indicadores.consumoPeriodoKg)}</strong>
            </div>
          </div>

          <div className="programacao-pp-acoes">
            <button
              type="button"
              className="programacao-pp-atualizar"
              onClick={recarregar}
              disabled={carregando || salvando || excluindo}
            >
              <RefreshCw size={16} strokeWidth={2} className={carregando ? "girando" : ""} />
              Atualizar
            </button>

            <button
              type="button"
              className="programacao-pp-novo"
              onClick={abrirNovo}
              disabled={salvando || excluindo || produtos.length === 0}
            >
              <Plus size={17} strokeWidth={2} />
              Nova programação
            </button>
          </div>
        </div>

        {carregando && (
          <div className="programacao-pp-estado">
            <Spinner />

            <strong>Carregando programação</strong>

            <p>Calculando período real, ciclos, cavidades e consumo previsto da produção.</p>
          </div>
        )}

        {!carregando && erro && (
          <div className="programacao-pp-estado programacao-pp-erro">
            <AlertTriangle size={30} />

            <strong>Não foi possível carregar a programação</strong>

            <p>{erro}</p>
          </div>
        )}

        {!carregando && !erro && carregado && programacao.length === 0 && (
          <div className="programacao-pp-estado">
            <CalendarDays size={34} strokeWidth={1.7} />

            <strong>Nenhuma produção programada</strong>

            <p>Cadastre o período real de produção para calcular o consumo previsto da produção.</p>

            {produtos.length > 0 && (
              <button type="button" className="programacao-pp-vazio-novo" onClick={abrirNovo}>
                <Plus size={16} />
                Nova programação
              </button>
            )}
          </div>
        )}

        {!carregando && !erro && programacao.length > 0 && (
          <>
            <div className="programacao-pp-tabela-container">
              <table className="programacao-pp-tabela">
                <thead>
                  <tr>
                    <th>Inj.</th>
                    <th>Código</th>
                    <th className="programacao-pp-texto">Produto</th>
                    <th>Ciclo</th>
                    <th>Cav.</th>
                    <th>Peso (kg)</th>
                    <th>Dias</th>
                    <th>Peças</th>
                    <th>Consumo (kg)</th>
                    <th>Receita</th>
                    <th>Ativa</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>

                <tbody>
                  {programacao.map((item) => {
                    const estaSalvando = itemEstaSalvando(item.id);

                    const estaExcluindo = itemEstaExcluindo(item.id);

                    const consumoPorFornecedor = (item.consumosFornecedores ?? [])
                      .map(
                        (fornecedor) =>
                          `${fornecedor.fornecedorNome}: ${formatarKg(fornecedor.consumoPeriodoKg)}`,
                      )
                      .join("\n");

                    return (
                      <tr key={item.id}>
                        <td className="programacao-pp-centro programacao-pp-forte">
                          {item.injetora || "-"}
                        </td>

                        <td className="programacao-pp-centro programacao-pp-codigo">
                          {item.codigoProduto}
                        </td>

                        <td className="programacao-pp-texto">
                          {item.descricao || "Sem descrição"}
                        </td>

                        <td className="programacao-pp-centro">
                          {item.cicloSegundos ? `${formatarNumero(item.cicloSegundos)} s` : "-"}
                        </td>

                        <td className="programacao-pp-centro">
                          {item.cavidadeMolde ? formatarNumero(item.cavidadeMolde) : "-"}
                        </td>

                        <td className="programacao-pp-numero">
                          {item.pesoKg ? formatarNumero(item.pesoKg, 3) : "-"}
                        </td>

                        <td className="programacao-pp-centro programacao-pp-forte">
                          {item.quantidadeDias}
                        </td>

                        <td className="programacao-pp-numero">
                          {formatarNumero(item.pecasPrevistas)}
                        </td>

                        <td
                          className="programacao-pp-numero programacao-pp-consumo"
                          title={consumoPorFornecedor || undefined}
                        >
                          {formatarNumero(item.consumoPeriodoKg, 3)}
                        </td>

                        <td className="programacao-pp-centro">
                          {item.receitaConfigurada ? (
                            <span title={(item.receitaNomes ?? []).join(" • ")}>
                              {(item.receitaNomes ?? []).length > 1
                                ? `${item.receitaNomes.length} receitas`
                                : item.receitaNomes?.[0] || "Definida"}
                            </span>
                          ) : (
                            <span className="programacao-pp-receita-pendente">
                              <AlertTriangle size={13} />
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="programacao-pp-centro">
                          <span
                            className={`programacao-pp-ativa${item.ativo ? " sim" : ""}`}
                            title={item.ativo ? "Ativa" : "Inativa"}
                            aria-label={item.ativo ? "Ativa" : "Inativa"}
                          />
                        </td>

                        <td className="programacao-pp-centro">
                          <div className="programacao-pp-acoes-linha">
                            <button
                              type="button"
                              className="programacao-pp-icone"
                              onClick={() => abrirEdicao(item)}
                              disabled={salvando || excluindo}
                              title={estaSalvando ? "Salvando..." : "Editar"}
                              aria-label="Editar programação"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              className="programacao-pp-icone perigo"
                              onClick={() => solicitarExclusao(item)}
                              disabled={salvando || excluindo}
                              title={estaExcluindo ? "Excluindo..." : "Excluir"}
                              aria-label="Excluir programação"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="programacao-pp-rodape">
              <strong>{programacao.length}</strong>{" "}
              {programacao.length === 1 ? "programação" : "programações"}
            </div>
          </>
        )}
      </div>

      <ProgramacaoModal
        aberto={modalAberto}
        item={itemEmEdicao}
        produtos={produtos}
        receitas={receitas}
        programacao={programacao}
        salvando={salvando}
        onCancelar={fecharModal}
        onSalvar={salvar}
      />

      <ConfirmacaoExclusao
        aberto={Boolean(itemParaExcluir)}
        titulo="Excluir programação?"
        descricao="Esta programação será removida definitivamente da projeção de matéria-prima."
        itemTitulo={itemParaExcluir?.descricao ?? ""}
        itemDescricao={itemParaExcluir ? `Código ${itemParaExcluir.codigoProduto}` : ""}
        detalhes={[
          {
            label: "Injetora",

            valor: itemParaExcluir?.injetora
              ? `Injetora ${itemParaExcluir.injetora}`
              : "Não informada",
          },

          {
            label: "Peças previstas",

            valor: itemParaExcluir ? formatarNumero(itemParaExcluir.pecasPrevistas) : "-",
          },

          {
            label: "Dias programados",

            valor: itemParaExcluir
              ? (itemParaExcluir.datasVigentes ?? []).map(formatarDiaMes).join(", ") || "-"
              : "-",
          },
        ]}
        erro={erroExclusao}
        processando={excluindo}
        textoConfirmar="Excluir programação"
        onCancelar={cancelarExclusao}
        onConfirmar={confirmarExclusao}
      />
    </>
  );
}
