import { useState } from "react";

import { estaEmAberto } from "../utils/comprasFuturasUtils";

/**
 * Controla os 3 fluxos de ação da tela:
 *  - modal de nova compra / edição
 *  - confirmação de chegada
 *  - exclusão
 */
export default function useAcoesComprasFuturas({
  salvando,
  excluindo,
  confirmandoChegada,
  salvarCompraFutura,
  confirmarChegadaCompraFutura,
  excluirCompraFutura,
}) {
  const ocupado = salvando || excluindo || confirmandoChegada;

  /* ---------------- MODAL (NOVA / EDITAR) ---------------- */

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);

  function abrirModal(compra) {
    setItemEdicao(compra);
    setModalAberto(true);
  }

  function novo() {
    if (ocupado) return;
    abrirModal(null);
  }

  function editar(compra) {
    if (!compra || ocupado) return;
    abrirModal(compra);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setItemEdicao(null);
  }

  async function salvar(dados) {
    await salvarCompraFutura(dados);
    setModalAberto(false);
    setItemEdicao(null);
  }

  /* ---------------- CONFIRMAR CHEGADA ---------------- */

  const [itemChegada, setItemChegada] = useState(null);

  function solicitarChegada(compra) {
    if (!compra || ocupado || !estaEmAberto(compra)) return;
    setItemChegada(compra);
  }

  function cancelarChegada() {
    if (confirmandoChegada) return;
    setItemChegada(null);
  }

  async function confirmarChegada({ id, dataRecebimento }) {
    await confirmarChegadaCompraFutura({ id, dataRecebimento });
    setItemChegada(null);
  }

  /* ---------------- EXCLUSÃO ---------------- */

  const [itemExclusao, setItemExclusao] = useState(null);
  const [erroExclusao, setErroExclusao] = useState("");

  function solicitarExclusao(compra) {
    if (!compra || ocupado) return;
    setErroExclusao("");
    setItemExclusao(compra);
  }

  function cancelarExclusao() {
    if (excluindo) return;
    setErroExclusao("");
    setItemExclusao(null);
  }

  async function confirmarExclusao() {
    if (!itemExclusao || excluindo) return;

    setErroExclusao("");

    try {
      await excluirCompraFutura(itemExclusao.id);
      setItemExclusao(null);
    } catch (error) {
      setErroExclusao(error?.message || "Não foi possível excluir a compra futura.");
    }
  }

  return {
    ocupado,
    modal: { aberto: modalAberto, item: itemEdicao, novo, editar, fechar: fecharModal, salvar },
    chegada: {
      item: itemChegada,
      solicitar: solicitarChegada,
      cancelar: cancelarChegada,
      confirmar: confirmarChegada,
    },
    exclusao: {
      item: itemExclusao,
      erro: erroExclusao,
      solicitar: solicitarExclusao,
      cancelar: cancelarExclusao,
      confirmar: confirmarExclusao,
    },
  };
}
