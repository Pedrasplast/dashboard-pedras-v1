import { CheckCircle2 } from "lucide-react";

import { TIPOS_CLASSIFICACAO } from "../comprasFuturas.regras";
import { descreverStatusCompra } from "../compraFuturaFormulario.regras";

import CampoNumeroCompra from "./CampoNumeroCompra";

export default function SecaoDadosCompra({
  formulario,
  item,
  fornecedores,
  materiaisDisponiveis,
  salvando,
  alterarCampo,
  alterarCampoLimpandoErro,
  alterarDataCompra,
  alterarFornecedor,
}) {
  const { fornecedorId } = formulario;
  const status = descreverStatusCompra(item?.status);

  return (
    <section className="compra-futura-modal-secao">
      <div className="compra-futura-modal-secao-titulo">
        <strong>Dados da compra</strong>

        <span>Informações operacionais e previsão de recebimento.</span>
      </div>

      <div className="compra-futura-modal-grid">
        <label className="compra-futura-modal-campo">
          <span>Data da compra</span>

          <input
            type="date"
            value={formulario.dataCompra}
            onChange={(event) => alterarDataCompra(event.target.value)}
            disabled={salvando}
          />
        </label>

        <label className="compra-futura-modal-campo">
          <span>Previsão de chegada</span>

          <input
            type="date"
            min={formulario.dataCompra}
            value={formulario.dataPrevista}
            onChange={(event) => alterarCampo("dataPrevista", event.target.value)}
            disabled={salvando}
          />
        </label>
      </div>

      <div className="compra-futura-modal-grid">
        <label className="compra-futura-modal-campo">
          <span>Fornecedor / fonte</span>

          <select
            value={fornecedorId}
            onChange={(event) => alterarFornecedor(event.target.value)}
            disabled={salvando}
          >
            <option value="">Selecione</option>

            {fornecedores

              .filter(
                (fornecedor) => fornecedor.ativo || String(fornecedor.id) === String(fornecedorId),
              )

              .map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}

                  {!fornecedor.ativo ? " (Inativo)" : ""}
                </option>
              ))}
          </select>
        </label>

        <label className="compra-futura-modal-campo">
          <span>Material</span>

          <select
            value={formulario.materialId}
            onChange={(event) => alterarCampoLimpandoErro("materialId", event.target.value)}
            disabled={salvando || !fornecedorId || materiaisDisponiveis.length === 0}
          >
            <option value="">
              {!fornecedorId
                ? "Selecione primeiro o fornecedor"
                : materiaisDisponiveis.length === 0
                  ? "Fornecedor sem material cadastrado"
                  : "Selecione"}
            </option>

            {materiaisDisponiveis.map((material) => (
              <option key={material.id} value={material.id}>
                {material.nome}

                {material.padrao ? " (padrão)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fornecedorId && materiaisDisponiveis.length === 0 && (
        <p className="compra-futura-modal-ajuda">
          Este fornecedor não possui material ativo vinculado. Faça o vínculo em Cadastro &gt;
          Fornecedor.
        </p>
      )}

      <div className="compra-futura-modal-grid compra-futura-modal-grid-3">
        <label className="compra-futura-modal-campo">
          <span>Tipo</span>

          <select
            value={formulario.tipoClassificacao}
            onChange={(event) => alterarCampoLimpandoErro("tipoClassificacao", event.target.value)}
            disabled={salvando}
          >
            <option value="">Selecione</option>

            {TIPOS_CLASSIFICACAO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </label>

        <CampoNumeroCompra
          titulo="Quantidade"
          value={formulario.quantidadeKg}
          onChange={(valor) => alterarCampo("quantidadeKg", valor)}
          placeholder="Ex.: 12000"
          sufixo="kg"
          disabled={salvando}
        />

        <label className="compra-futura-modal-campo">
          <span>Pedido / OC</span>

          <input
            type="text"
            value={formulario.numeroPedido}
            onChange={(event) => alterarCampo("numeroPedido", event.target.value)}
            placeholder="Ex.: 14587"
            disabled={salvando}
          />
        </label>
      </div>

      <div className="compra-futura-modal-status">
        <CheckCircle2 size={17} aria-hidden="true" />

        <div>
          <strong>Status: {status.nome}</strong>

          <span>{status.descricao}</span>
        </div>
      </div>

      <label className="compra-futura-modal-campo">
        <span>Observação</span>

        <textarea
          rows={3}
          value={formulario.observacao}
          onChange={(event) => alterarCampo("observacao", event.target.value)}
          placeholder="Informações operacionais adicionais..."
          disabled={salvando}
        />
      </label>
    </section>
  );
}
