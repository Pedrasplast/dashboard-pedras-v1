import { useEffect, useMemo, useState } from "react";

import { obterHojeISO } from "@/shared/lib/datas";

import { calcularResumoFinanceiroCompra } from "../comprasFuturas.regras";
import {
  FORMULARIO_VAZIO,
  criarFormulario,
  filtrarVinculosDoFornecedor,
  listarMateriaisDisponiveis,
  montarCompraDoFormulario,
  obterMaterialInicial,
  validarFormulario,
} from "../compraFuturaFormulario.regras";

/**
 * Estado do modal de compra futura: campos, erro, listas derivadas e envio.
 */
export default function useCompraFuturaFormulario({
  aberto,
  item,
  materiais,
  fornecedorMateriais,
  onSalvar,
}) {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    setFormulario(criarFormulario(item, obterHojeISO()));
    setErro("");
  }, [aberto, item]);

  const {
    fornecedorId,
    materialId,
    quantidadeKg,
    precoUnitario,
    ipiPercentual,
    valorFrete,
    tipoFrete,
    valorDesconto,
    outrasDespesas,
  } = formulario;

  const materiaisDisponiveis = useMemo(
    () =>
      listarMateriaisDisponiveis(
        filtrarVinculosDoFornecedor(fornecedorMateriais, fornecedorId),
        materiais,
        materialId,
      ),
    [fornecedorMateriais, fornecedorId, materiais, materialId],
  );

  const resumoFinanceiro = useMemo(
    () =>
      calcularResumoFinanceiroCompra({
        quantidadeKg,
        precoUnitario,
        ipiPercentual,
        valorFrete,
        tipoFrete,
        valorDesconto,
        outrasDespesas,
      }),
    [
      quantidadeKg,
      precoUnitario,
      ipiPercentual,
      valorFrete,
      tipoFrete,
      valorDesconto,
      outrasDespesas,
    ],
  );

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarCampoLimpandoErro(campo, valor) {
    alterarCampo(campo, valor);
    setErro("");
  }

  // A previsão acompanha a data da compra quando ficaria anterior a ela.
  function alterarDataCompra(valor) {
    setFormulario((atual) => ({
      ...atual,
      dataCompra: valor,
      dataPrevista: atual.dataPrevista < valor ? valor : atual.dataPrevista,
    }));
  }

  function alterarFornecedor(novoFornecedorId) {
    const vinculos = filtrarVinculosDoFornecedor(fornecedorMateriais, novoFornecedorId);

    setFormulario((atual) => ({
      ...atual,
      fornecedorId: novoFornecedorId,
      materialId: obterMaterialInicial(vinculos),
    }));
    setErro("");
  }

  function alterarTipoFrete(novoTipo) {
    setFormulario((atual) => ({
      ...atual,
      tipoFrete: novoTipo,
      valorFrete: novoTipo === "SEM_FRETE" ? "0" : atual.valorFrete,
    }));
    setErro("");
  }

  async function enviar(event) {
    event.preventDefault();

    const erroValidacao = validarFormulario(formulario, resumoFinanceiro);

    setErro(erroValidacao);

    if (erroValidacao) return;

    try {
      await onSalvar?.(montarCompraDoFormulario(formulario, item));
    } catch (error) {
      setErro(error?.message || "Não foi possível salvar a compra.");
    }
  }

  return {
    formulario,
    erro,
    materiaisDisponiveis,
    resumoFinanceiro,
    alterarCampo,
    alterarCampoLimpandoErro,
    alterarDataCompra,
    alterarFornecedor,
    alterarTipoFrete,
    enviar,
  };
}
