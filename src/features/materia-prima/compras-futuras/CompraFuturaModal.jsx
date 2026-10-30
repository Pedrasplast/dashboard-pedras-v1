import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";

import { Save, ShoppingCart, X } from "lucide-react";

import SecaoDadosCompra from "./components/SecaoDadosCompra";
import SecaoValoresCompra from "./components/SecaoValoresCompra";
import useCompraFuturaFormulario from "./hooks/useCompraFuturaFormulario";

import "./CompraFuturaModal.css";

export default function CompraFuturaModal({
  aberto,
  item = null,
  fornecedores = [],
  materiais = [],
  fornecedorMateriais = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const {
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
  } = useCompraFuturaFormulario({ aberto, item, materiais, fornecedorMateriais, onSalvar });

  if (!aberto) return null;

  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={onCancelar}
      bloqueado={salvando}
      tamanho="medio"
      fecharAoClicarFora={false}
    >
      <div className="compra-futura-modal">
        <div className="compra-futura-modal-header" data-modal-header="">
          <div className="compra-futura-modal-icone" data-modal-icone="">
            <ShoppingCart size={22} aria-hidden="true" />
          </div>

          <div className="compra-futura-modal-header-texto">
            <span>Matéria-Prima</span>

            <ModalTitulo>
              <h3>{item ? "Editar compra" : "Nova compra futura"}</h3>
            </ModalTitulo>

            <p>Cadastre ou edite os dados da compra. A chegada é confirmada separadamente.</p>
          </div>

          <button
            type="button"
            className="compra-futura-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={19} />
          </button>
        </div>

        <form className="compra-futura-modal-form" onSubmit={enviar} data-modal-form="">
          <SecaoDadosCompra
            formulario={formulario}
            item={item}
            fornecedores={fornecedores}
            materiaisDisponiveis={materiaisDisponiveis}
            salvando={salvando}
            alterarCampo={alterarCampo}
            alterarCampoLimpandoErro={alterarCampoLimpandoErro}
            alterarDataCompra={alterarDataCompra}
            alterarFornecedor={alterarFornecedor}
          />

          <SecaoValoresCompra
            formulario={formulario}
            resumoFinanceiro={resumoFinanceiro}
            salvando={salvando}
            alterarCampo={alterarCampo}
            alterarTipoFrete={alterarTipoFrete}
          />

          <label className="compra-futura-modal-status">
            <input
              type="checkbox"
              checked={formulario.ativo}
              onChange={(event) => alterarCampo("ativo", event.target.checked)}
              disabled={salvando}
            />

            <div>
              <strong>Compra ativa</strong>

              <span>Compras inativas não entram nos cálculos da projeção.</span>
            </div>
          </label>

          {erro && <div className="compra-futura-modal-erro">{erro}</div>}

          <div className="compra-futura-modal-acoes" data-modal-footer="">
            <button
              type="button"
              className="compra-futura-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
              data-modal-acao="secundaria"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="compra-futura-modal-salvar"
              disabled={salvando}
              data-modal-acao="primaria"
            >
              <Save size={17} />

              {salvando ? "Salvando..." : "Salvar compra"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
